# config.py
# ============================================================
#  Hyperparameters and Global Settings
# ============================================================

import torch

# ---------- Reproducibility ----------
SEED: int = 42

# ---------- Audio ----------
SAMPLE_RATE: int = 16000        # Wav2Vec2 expects 16kHz audio
MAX_DURATION: float = 6.0       # Maximum duration in seconds; longer audio will be truncated
MAX_LENGTH: int = int(SAMPLE_RATE * MAX_DURATION)

# ---------- Labels ----------
# Mapping from emotion strings to IDs
# neutral = 0, angry = 1, happy = 2, sad = 3
LABEL2ID: dict[str, int] = {"neutral": 0, "angry": 1, "happy": 2, "sad": 3}
ID2LABEL: dict[int, str] = {v: k for k, v in LABEL2ID.items()}
NUM_LABELS: int = len(LABEL2ID)

# RAVDESS Dataset Emotion Mapping
# The filename format contains an emotion identifier at index 2
RAVDESS_EMOTION_MAP: dict[str, str] = {
    "01": "neutral",   # neutral
    "03": "happy",     # happy
    "04": "sad",       # sad
    "05": "angry",     # angry
    # Other emotions in RAVDESS are ignored for this 4-class setup
}

# ---------- Model ----------
# Base model architecture from HuggingFace
MODEL_NAME: str = "facebook/wav2vec2-base"

# ---------- Training ----------
OUTPUT_DIR: str = "./ser_output"
BATCH_SIZE: int = 4
GRAD_ACCUM_STEPS: int = 2       # Effective batch size = BATCH_SIZE * GRAD_ACCUM_STEPS = 8
WEIGHT_DECAY: float = 0.01
WARMUP_RATIO: float = 0.1
FP16: bool = torch.cuda.is_available()

# Phase 1: Train the classification head only (feature encoder frozen)
PHASE1_LR: float = 1e-4
PHASE1_EPOCHS: int = 3

# Phase 2: Unfreeze all layers and fine-tune with a lower learning rate
PHASE2_LR: float = 3e-5
PHASE2_EPOCHS: int = 12

EARLY_STOPPING_PATIENCE: int = 4

# ---------- Data Split ----------
VAL_SIZE: float = 0.15
TEST_SIZE: float = 0.15
