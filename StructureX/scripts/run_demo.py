"""
StructureX — End-to-End Demo Script
Runs: data generation → model training → starts API server.
"""

import sys
import subprocess
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))


def main():
    print("=" * 60)
    print("StructureX — End-to-End Demo")
    print("=" * 60)

    # Step 1: Generate data
    print("\n[Step 1] Generating data...")
    from scripts.generate_data import main as generate
    generate()

    # Step 2: Train models
    print("\n[Step 2] Training models...")
    from scripts.train_models import main as train
    train()

    # Step 3: Start server
    print("\n[Step 3] Starting API server...")
    print("Dashboard will be available at: http://localhost:8000")
    print("Press Ctrl+C to stop.\n")

    import uvicorn
    from backend.main import app
    uvicorn.run(app, host="0.0.0.0", port=8000)


if __name__ == "__main__":
    main()
