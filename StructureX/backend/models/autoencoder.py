"""
StructureX — Module 5a: Autoencoder Anomaly Detection
PyTorch autoencoder for detecting anomalous sensor patterns.

Architecture:
    Encoder: input_dim → 64 → 32 → 16 (latent)
    Decoder: 16 → 32 → 64 → input_dim

Input:  sliding window of length 20 over sensor features (flattened)
Output: anomaly_score ∈ [0, 1] based on reconstruction error

Training: MSE reconstruction loss, Adam optimizer
Threshold: calibrated from training set 95th percentile of reconstruction error
"""

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
from typing import Tuple, Optional

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.config import (
    AE_WINDOW_SIZE, AE_HIDDEN_DIMS, AE_LEARNING_RATE,
    AE_EPOCHS, AE_BATCH_SIZE, AE_ANOMALY_PERCENTILE,
    MODEL_DIR, RANDOM_SEED,
)


class Autoencoder(nn.Module):
    """
    Symmetric autoencoder for anomaly detection.

    Architecture:
        Encoder: Linear(input→64) → ReLU → Linear(64→32) → ReLU → Linear(32→16)
        Decoder: Linear(16→32) → ReLU → Linear(32→64) → ReLU → Linear(64→input)

    Anomaly = high reconstruction error (input ≠ reconstruction)
    """

    def __init__(self, input_dim: int):
        super().__init__()
        self.input_dim = input_dim
        h1, h2, h3 = AE_HIDDEN_DIMS  # [64, 32, 16]

        self.encoder = nn.Sequential(
            nn.Linear(input_dim, h1),
            nn.ReLU(),
            nn.BatchNorm1d(h1),
            nn.Linear(h1, h2),
            nn.ReLU(),
            nn.BatchNorm1d(h2),
            nn.Linear(h2, h3),
            nn.ReLU(),
        )

        self.decoder = nn.Sequential(
            nn.Linear(h3, h2),
            nn.ReLU(),
            nn.BatchNorm1d(h2),
            nn.Linear(h2, h1),
            nn.ReLU(),
            nn.BatchNorm1d(h1),
            nn.Linear(h1, input_dim),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        latent = self.encoder(x)
        reconstructed = self.decoder(latent)
        return reconstructed


class AnomalyDetector:
    """
    Wrapper for autoencoder training, inference, and threshold calibration.

    Input schema:  2D array of shape (num_samples, num_features * window_size)
    Output schema: anomaly_score ∈ [0, 1] per sample
    """

    def __init__(self, input_dim: int):
        torch.manual_seed(RANDOM_SEED)
        self.model = Autoencoder(input_dim)
        self.threshold = 0.0  # Calibrated after training
        self.criterion = nn.MSELoss(reduction="none")
        self.optimizer = torch.optim.Adam(
            self.model.parameters(), lr=AE_LEARNING_RATE
        )
        self.device = torch.device("cpu")
        self.model.to(self.device)
        self.trained = False

    def create_windows(
        self, data: np.ndarray, window_size: int = AE_WINDOW_SIZE
    ) -> np.ndarray:
        """
        Create sliding windows from time-series data.

        Input:  (num_timesteps, num_features) array
        Output: (num_windows, num_features * window_size) array

        Each window is a flattened slice of `window_size` consecutive rows.
        """
        n_samples, n_features = data.shape
        if n_samples < window_size:
            # Pad by repeating the first row
            pad = np.tile(data[0], (window_size - n_samples, 1))
            data = np.vstack([pad, data])
            n_samples = data.shape[0]

        windows = []
        for i in range(n_samples - window_size + 1):
            window = data[i : i + window_size].flatten()
            windows.append(window)

        return np.array(windows, dtype=np.float32)

    def train(self, data: np.ndarray, epochs: int = AE_EPOCHS) -> dict:
        """
        Train autoencoder on normal data.

        Input:  (num_timesteps, num_features) array
        Output: training metrics dict

        After training, calibrates anomaly threshold from 95th percentile
        of reconstruction error on training data.
        """
        windows = self.create_windows(data)
        dataset = TensorDataset(torch.FloatTensor(windows))
        dataloader = DataLoader(dataset, batch_size=AE_BATCH_SIZE, shuffle=True)

        self.model.train()
        losses = []

        for epoch in range(epochs):
            epoch_loss = 0.0
            for (batch,) in dataloader:
                batch = batch.to(self.device)
                self.optimizer.zero_grad()
                reconstructed = self.model(batch)
                loss = self.criterion(reconstructed, batch).mean()
                loss.backward()
                self.optimizer.step()
                epoch_loss += loss.item()

            avg_loss = epoch_loss / len(dataloader)
            losses.append(avg_loss)
            if (epoch + 1) % 10 == 0:
                print(f"  [Autoencoder] Epoch {epoch+1}/{epochs}, Loss: {avg_loss:.6f}")

        # Calibrate threshold
        self.model.eval()
        with torch.no_grad():
            all_windows = torch.FloatTensor(windows).to(self.device)
            reconstructed = self.model(all_windows)
            errors = self.criterion(reconstructed, all_windows).mean(dim=1).numpy()
            self.threshold = float(np.percentile(errors, AE_ANOMALY_PERCENTILE))

        self.trained = True
        print(f"  [Autoencoder] Threshold calibrated: {self.threshold:.6f}")

        return {
            "final_loss": losses[-1],
            "threshold": self.threshold,
            "num_windows": len(windows),
        }

    def predict(self, data: np.ndarray) -> np.ndarray:
        """
        Predict anomaly scores.

        Input:  (num_timesteps, num_features) array
        Output: (num_windows,) array of anomaly_score ∈ [0, 1]

        Score = sigmoid(reconstruction_error / threshold - 1)
        This maps errors near threshold to ~0.5, above to >0.5
        """
        if not self.trained:
            raise RuntimeError("Model not trained. Call train() first.")

        windows = self.create_windows(data)
        self.model.eval()

        with torch.no_grad():
            inputs = torch.FloatTensor(windows).to(self.device)
            reconstructed = self.model(inputs)
            errors = self.criterion(reconstructed, inputs).mean(dim=1).numpy()

        # Sigmoid normalization: error/threshold → [0, 1]
        # error == threshold → score ≈ 0.5
        # error >> threshold → score → 1.0
        scores = 1.0 / (1.0 + np.exp(-(errors / max(self.threshold, 1e-8) - 1.0) * 5))
        return scores.astype(np.float32)

    def save(self, path: Optional[Path] = None):
        """Save model weights and threshold."""
        path = path or MODEL_DIR / "autoencoder.pt"
        torch.save({
            "model_state": self.model.state_dict(),
            "threshold": self.threshold,
            "input_dim": self.model.input_dim,
        }, path)
        print(f"  [Autoencoder] Saved to {path}")

    def load(self, path: Optional[Path] = None):
        """Load model weights and threshold."""
        path = path or MODEL_DIR / "autoencoder.pt"
        checkpoint = torch.load(path, map_location=self.device, weights_only=False)
        self.model = Autoencoder(checkpoint["input_dim"])
        self.model.load_state_dict(checkpoint["model_state"])
        self.model.to(self.device)
        self.threshold = checkpoint["threshold"]
        self.trained = True
        print(f"  [Autoencoder] Loaded from {path}")
