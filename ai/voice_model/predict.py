# predict.py
# ============================================================
#  Inference script to use the trained model for predictions.
#  Run via: python predict.py --audio path/to/file.wav
# ============================================================

import argparse
from typing import Tuple, Dict

import numpy as np
import torch
import librosa
from transformers import (
    Wav2Vec2Processor,
    Wav2Vec2ForSequenceClassification
)

from config import SAMPLE_RATE, MAX_LENGTH, ID2LABEL, OUTPUT_DIR


def predict_emotion(audio_path: str, model_dir: str = f"{OUTPUT_DIR}/final_model") -> Tuple[str, Dict[str, float]]:
    """
    Takes an audio file path, runs it through the model, and returns the 
    predicted emotion along with the probabilities for all 4 classes.

    Args:
        audio_path (str): Path to the input .wav file.
        model_dir (str, optional): Path to the saved model. Defaults to output dir.

    Returns:
        Tuple[str, Dict[str, float]]: The predicted emotion label and a dictionary of class probabilities.
    """
    # Load model and processor
    print(f"[Loading] Model from {model_dir} ...")
    try:
        processor = Wav2Vec2Processor.from_pretrained(model_dir)
    except Exception:
        print("[Warning] Processor files not found. Loading processor from facebook/wav2vec2-base...")
        from config import MODEL_NAME
        processor = Wav2Vec2Processor.from_pretrained(MODEL_NAME)
        
    model = Wav2Vec2ForSequenceClassification.from_pretrained(model_dir)
    model.eval()

    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = model.to(device)

    # Load audio
    print(f"[Audio] Loading {audio_path} ...")
    audio, _ = librosa.load(audio_path, sr=SAMPLE_RATE, mono=True)

    # Normalize audio
    audio = audio / (np.max(np.abs(audio)) + 1e-8)

    # Truncate or Pad
    if len(audio) > MAX_LENGTH:
        audio = audio[:MAX_LENGTH]
    else:
        audio = np.pad(audio, (0, MAX_LENGTH - len(audio)), mode="constant")

    # Process audio
    inputs = processor(
        audio.astype(np.float32),
        sampling_rate=SAMPLE_RATE,
        return_tensors="pt"
    )
    input_values = inputs.input_values.to(device)

    # Inference
    with torch.no_grad():
        logits = model(input_values).logits

    probs = torch.softmax(logits, dim=-1).squeeze().cpu().tolist()
    pred_id = int(np.argmax(probs))
    pred_label = ID2LABEL[pred_id]

    # Print results
    print("\n" + "=" * 40)
    print(f"  Predicted Emotion : {pred_label.upper()}")
    print("=" * 40)
    print("  Probabilities:")
    for idx, prob in enumerate(probs):
        label = ID2LABEL[idx]
        bar = "█" * int(prob * 30)
        print(f"    {label:<8} {prob:.4f}  {bar}")
    print("=" * 40)

    return pred_label, {ID2LABEL[i]: round(p, 4) for i, p in enumerate(probs)}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Predict emotion from an audio file.")
    parser.add_argument("--audio", type=str, required=True, help="Path to the audio file (.wav)")
    parser.add_argument("--model_dir", type=str, default=f"{OUTPUT_DIR}/final_model", help="Path to the saved model directory")
    args = parser.parse_args()

    predict_emotion(args.audio, args.model_dir)

