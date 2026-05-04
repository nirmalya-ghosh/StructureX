"""
StructureX — Module 5b: LSTM Time-Series Prediction
PyTorch LSTM for predicting failure probability and degradation.

Architecture:
    LSTM: 2-layer, hidden_dim=64, dropout=0.2
    Head 1: Linear → Sigmoid → failure_probability ∈ [0, 1]
    Head 2: Linear → predicted_degradation ∈ [0, ∞)

Input:  30-timestep sequences of sensor + environment features
Output: (failure_probability, predicted_degradation)

Training: Combined loss = BCE(failure_prob) + MSE(degradation)
Labels:  derived from fatigue_index thresholds
"""

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
from typing import Tuple, Optional, Dict

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.config import (
    LSTM_WINDOW_SIZE, LSTM_HIDDEN_DIM, LSTM_NUM_LAYERS,
    LSTM_DROPOUT, LSTM_LEARNING_RATE, LSTM_EPOCHS, LSTM_BATCH_SIZE,
    MODEL_DIR, RANDOM_SEED,
)


class LSTMPredictor(nn.Module):
    """
    Dual-head LSTM for time-series prediction.

    Architecture:
        LSTM(input_features, hidden=64, layers=2, dropout=0.2)
        → take last hidden state
        Head 1: Linear(64→1) → Sigmoid → failure_probability
        Head 2: Linear(64→1) → ReLU → predicted_degradation
    """

    def __init__(self, input_features: int):
        super().__init__()
        self.input_features = input_features
        self.hidden_dim = LSTM_HIDDEN_DIM

        self.lstm = nn.LSTM(
            input_size=input_features,
            hidden_size=LSTM_HIDDEN_DIM,
            num_layers=LSTM_NUM_LAYERS,
            dropout=LSTM_DROPOUT,
            batch_first=True,
        )

        # Head 1: Failure probability (binary classification)
        self.failure_head = nn.Sequential(
            nn.Linear(LSTM_HIDDEN_DIM, 32),
            nn.ReLU(),
            nn.Linear(32, 1),
            nn.Sigmoid(),
        )

        # Head 2: Degradation prediction (regression)
        self.degradation_head = nn.Sequential(
            nn.Linear(LSTM_HIDDEN_DIM, 32),
            nn.ReLU(),
            nn.Linear(32, 1),
            nn.ReLU(),  # degradation >= 0
        )

    def forward(
        self, x: torch.Tensor
    ) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Forward pass.

        Input:  (batch, seq_len, features)
        Output: (failure_prob [batch, 1], degradation [batch, 1])
        """
        lstm_out, (h_n, _) = self.lstm(x)
        # Use last hidden state of final layer
        last_hidden = h_n[-1]  # (batch, hidden_dim)

        failure_prob = self.failure_head(last_hidden)
        degradation = self.degradation_head(last_hidden)

        return failure_prob, degradation


class TimeSeriesPredictor:
    """
    Wrapper for LSTM training and inference.

    Input schema:  (num_timesteps, num_features) array
    Output schema: failure_probability ∈ [0,1], predicted_degradation ∈ [0,∞)
    """

    def __init__(self, input_features: int):
        torch.manual_seed(RANDOM_SEED)
        self.model = LSTMPredictor(input_features)
        self.device = torch.device("cpu")
        self.model.to(self.device)
        self.trained = False

    def create_sequences(
        self,
        data: np.ndarray,
        failure_labels: np.ndarray,
        degradation_labels: np.ndarray,
        window_size: int = LSTM_WINDOW_SIZE,
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Create sequences for LSTM training.

        Input:
            data: (num_timesteps, num_features)
            failure_labels: (num_timesteps,) binary labels
            degradation_labels: (num_timesteps,) continuous values

        Output:
            X: (num_sequences, window_size, num_features)
            y_failure: (num_sequences,)
            y_degradation: (num_sequences,)

        Each sequence predicts the label at the NEXT timestep after the window.
        """
        n = len(data)
        if n <= window_size:
            # Pad data
            pad = np.tile(data[0], (window_size - n + 2, 1))
            data = np.vstack([pad, data])
            failure_labels = np.concatenate([
                np.zeros(window_size - n + 2), failure_labels
            ])
            degradation_labels = np.concatenate([
                np.zeros(window_size - n + 2), degradation_labels
            ])
            n = len(data)

        X, y_f, y_d = [], [], []
        for i in range(n - window_size):
            X.append(data[i : i + window_size])
            y_f.append(failure_labels[i + window_size - 1])
            y_d.append(degradation_labels[i + window_size - 1])

        return (
            np.array(X, dtype=np.float32),
            np.array(y_f, dtype=np.float32),
            np.array(y_d, dtype=np.float32),
        )

    def create_labels(
        self, fatigue: np.ndarray, strain: np.ndarray
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Create training labels from structural data.

        Failure labels: 1 if fatigue_index > 0.7 OR strain rate is extreme
        Degradation labels: normalized fatigue_index (continuous target)

        Input:  fatigue array, strain array
        Output: (failure_binary, degradation_continuous)
        """
        # Failure: high fatigue indicates approaching failure
        failure = (fatigue > 0.7).astype(np.float32)

        # Also flag rapid strain changes as failure
        strain_rate = np.abs(np.diff(strain, prepend=strain[0]))
        strain_threshold = np.percentile(strain_rate, 95)
        failure = np.clip(failure + (strain_rate > strain_threshold).astype(np.float32), 0, 1)

        # Degradation: normalized fatigue
        degradation = fatigue.copy().astype(np.float32)

        return failure, degradation

    def train(
        self,
        data: np.ndarray,
        fatigue: np.ndarray,
        strain: np.ndarray,
        epochs: int = LSTM_EPOCHS,
    ) -> Dict[str, float]:
        """
        Train LSTM on time-series data.

        Input:
            data: (num_timesteps, num_features)
            fatigue: (num_timesteps,) fatigue index values
            strain: (num_timesteps,) strain values

        Output: training metrics dict
        """
        failure_labels, degradation_labels = self.create_labels(fatigue, strain)
        X, y_f, y_d = self.create_sequences(data, failure_labels, degradation_labels)

        dataset = TensorDataset(
            torch.FloatTensor(X),
            torch.FloatTensor(y_f),
            torch.FloatTensor(y_d),
        )
        dataloader = DataLoader(dataset, batch_size=LSTM_BATCH_SIZE, shuffle=True)

        bce_loss = nn.BCELoss()
        mse_loss = nn.MSELoss()
        optimizer = torch.optim.Adam(self.model.parameters(), lr=LSTM_LEARNING_RATE)

        self.model.train()
        losses = []

        for epoch in range(epochs):
            epoch_loss = 0.0
            for batch_x, batch_yf, batch_yd in dataloader:
                batch_x = batch_x.to(self.device)
                batch_yf = batch_yf.to(self.device).unsqueeze(1)
                batch_yd = batch_yd.to(self.device).unsqueeze(1)

                optimizer.zero_grad()
                pred_f, pred_d = self.model(batch_x)

                loss_f = bce_loss(pred_f, batch_yf)
                loss_d = mse_loss(pred_d, batch_yd)
                loss = loss_f + loss_d

                loss.backward()
                optimizer.step()
                epoch_loss += loss.item()

            avg_loss = epoch_loss / len(dataloader)
            losses.append(avg_loss)
            if (epoch + 1) % 10 == 0:
                print(f"  [LSTM] Epoch {epoch+1}/{epochs}, Loss: {avg_loss:.6f}")

        self.trained = True
        return {"final_loss": losses[-1], "num_sequences": len(X)}

    def predict(self, data: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Predict failure probability and degradation.

        Input:  (num_timesteps, num_features) array
        Output: (failure_probs, degradations) each (num_sequences,)
        """
        if not self.trained:
            raise RuntimeError("Model not trained. Call train() first.")

        # Create sequences without labels (dummy labels)
        dummy_labels = np.zeros(len(data), dtype=np.float32)
        X, _, _ = self.create_sequences(data, dummy_labels, dummy_labels)

        self.model.eval()
        with torch.no_grad():
            inputs = torch.FloatTensor(X).to(self.device)
            failure_probs, degradations = self.model(inputs)

        return (
            failure_probs.squeeze().numpy(),
            degradations.squeeze().numpy(),
        )

    def save(self, path: Optional[Path] = None):
        """Save model weights."""
        path = path or MODEL_DIR / "lstm_model.pt"
        torch.save({
            "model_state": self.model.state_dict(),
            "input_features": self.model.input_features,
        }, path)
        print(f"  [LSTM] Saved to {path}")

    def load(self, path: Optional[Path] = None):
        """Load model weights."""
        path = path or MODEL_DIR / "lstm_model.pt"
        checkpoint = torch.load(path, map_location=self.device, weights_only=False)
        self.model = LSTMPredictor(checkpoint["input_features"])
        self.model.load_state_dict(checkpoint["model_state"])
        self.model.to(self.device)
        self.trained = True
        print(f"  [LSTM] Loaded from {path}")
