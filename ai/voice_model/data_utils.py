# data_utils.py
# ============================================================
#  Data utilities:
#  - RAVDESS Dataset loading
#  - Audio Augmentation
#  - PyTorch Dataset class
# ============================================================

import os
import glob
import random
from typing import List, Dict, Any

import numpy as np
import pandas as pd
import librosa
import torch
from torch.utils.data import Dataset
from pathlib import Path
from audiomentations import (
    Compose, AddGaussianNoise, TimeStretch,
    PitchShift, Shift, RoomSimulator
)

from config import (
    SAMPLE_RATE, MAX_LENGTH, LABEL2ID,
    RAVDESS_EMOTION_MAP, SEED
)


# ============================================================
# 1. Load RAVDESS Dataset
# ============================================================
def load_ravdess(data_dir: str) -> pd.DataFrame:
    """
    Iterates through all RAVDESS audio files and extracts the label from the filename.

    Filename format: 03-01-{emotion}-01-01-01-{actor}.wav
    The third part (index 2) is the emotion code.

    Args:
        data_dir (str): Path to the directory containing RAVDESS .wav files.

    Returns:
        pd.DataFrame: A dataframe containing two columns: [path, label].
    """
    records: List[Dict[str, str]] = []
    audio_files = glob.glob(os.path.join(data_dir, "**", "*.wav"), recursive=True)

    if not audio_files:
        raise FileNotFoundError(
            f"No .wav files found in {data_dir}\n"
            "Ensure that you have downloaded the RAVDESS dataset and placed it in the correct path."
        )

    for filepath in audio_files:
        stem = Path(filepath).stem
        parts = stem.split("-")

        # RAVDESS files start with a modality code
        # audio-only files start with "03"
        if len(parts) < 7:
            continue

        emotion_code = parts[2]
        if emotion_code in RAVDESS_EMOTION_MAP:
            records.append({
                "path":  filepath,
                "label": RAVDESS_EMOTION_MAP[emotion_code]
            })

    df = pd.DataFrame(records)
    print(f"[RAVDESS] Successfully loaded {len(df)} files")
    print(df["label"].value_counts().to_string())
    return df


# ============================================================
# 2. Audio Augmentation (applied to training data only)
# ============================================================
train_augment = Compose([
    AddGaussianNoise(min_amplitude=0.001, max_amplitude=0.015, p=0.4),
    TimeStretch(min_rate=0.85, max_rate=1.15, p=0.4),
    PitchShift(min_semitones=-3, max_semitones=3, p=0.4),
    Shift(p=0.3),
    RoomSimulator(p=0.2),   # Adds room reverb for more realism
], shuffle=True)


def load_and_preprocess(filepath: str, augment: bool = False) -> np.ndarray:
    """
    Loads an audio file, resamples it, optionally applies augmentation, 
    and truncates or pads it to a fixed length.

    Args:
        filepath (str): Path to the audio file.
        augment (bool, optional): Whether to apply audio augmentation. Defaults to False.

    Returns:
        np.ndarray: Processed audio array of shape (MAX_LENGTH,).
    """
    audio, _ = librosa.load(filepath, sr=SAMPLE_RATE, mono=True)

    if augment:
        audio = train_augment(samples=audio, sample_rate=SAMPLE_RATE)

    # Normalize audio
    audio = audio / (np.max(np.abs(audio)) + 1e-8)

    # Truncate or Pad
    if len(audio) > MAX_LENGTH:
        # Start from a random offset when augmenting so we don't always take the same chunk
        if augment:
            start = random.randint(0, len(audio) - MAX_LENGTH)
            audio = audio[start: start + MAX_LENGTH]
        else:
            audio = audio[:MAX_LENGTH]
    else:
        audio = np.pad(audio, (0, MAX_LENGTH - len(audio)), mode="constant")

    return audio.astype(np.float32)


# ============================================================
# 3. PyTorch Dataset
# ============================================================
class SpeechEmotionDataset(Dataset):
    """
    PyTorch Dataset class for speech emotion recognition.

    Takes a pandas DataFrame and returns a dictionary with:
    - input_values: processed audio tensor
    - labels: class index tensor
    """

    def __init__(self, df: pd.DataFrame, processor: Any, augment: bool = False):
        self.df = df.reset_index(drop=True)
        self.processor = processor
        self.augment = augment

    def __len__(self) -> int:
        return len(self.df)

    def __getitem__(self, idx: int) -> Dict[str, torch.Tensor]:
        row = self.df.iloc[idx]
        audio = load_and_preprocess(row["path"], augment=self.augment)

        # Wav2Vec2Processor handles feature extraction
        inputs = self.processor(
            audio,
            sampling_rate=SAMPLE_RATE,
            return_tensors="pt",
            padding=False
        )
        input_values = inputs.input_values.squeeze(0)   # [T]
        label = LABEL2ID[row["label"]]

        return {
            "input_values": input_values,
            "labels": torch.tensor(label, dtype=torch.long)
        }


# ============================================================
# 4. Collate Function (pads sequences within a batch)
# ============================================================
def collate_fn(batch: List[Dict[str, torch.Tensor]]) -> Dict[str, torch.Tensor]:
    """
    Collates a list of dataset elements into a batch, padding sequences dynamically.

    Args:
        batch (list): List of dictionaries containing 'input_values' and 'labels'.

    Returns:
        dict: A dictionary containing padded 'input_values' and stacked 'labels'.
    """
    input_values = [item["input_values"] for item in batch]
    labels = torch.stack([item["labels"] for item in batch])

    # Pad sequences to the maximum length in the current batch
    max_len = max(x.shape[0] for x in input_values)
    padded = torch.zeros(len(input_values), max_len)
    for i, x in enumerate(input_values):
        padded[i, :x.shape[0]] = x

    return {"input_values": padded, "labels": labels}


# ============================================================
# 5. Compute Class Weights (to handle class imbalance)
# ============================================================
def compute_class_weights(df: pd.DataFrame) -> torch.Tensor:
    """
    Computes a weight for each class inversely proportional to its frequency.
    Minority classes will receive a higher weight.

    Args:
        df (pd.DataFrame): Training dataframe containing the 'label' column.

    Returns:
        torch.Tensor: A tensor containing class weights.
    """
    counts = df["label"].value_counts()
    total = len(df)
    weights: List[float] = []
    
    for label in LABEL2ID.keys():
        w = total / (len(LABEL2ID) * counts.get(label, 1))
        weights.append(w)
        
    return torch.tensor(weights, dtype=torch.float32)

