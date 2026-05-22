# model_utils.py
# ============================================================
#  - Model Construction
#  - Custom Trainer with Weighted Cross-Entropy
#  - Evaluation Metrics
# ============================================================

from typing import Tuple, Dict, Any

import numpy as np
import torch
import torch.nn as nn
from transformers import (
    Wav2Vec2ForSequenceClassification,
    Trainer
)
from sklearn.metrics import accuracy_score, f1_score

from config import MODEL_NAME, LABEL2ID, ID2LABEL, NUM_LABELS


# ============================================================
# 1. Model Construction
# ============================================================
def build_model() -> Wav2Vec2ForSequenceClassification:
    """
    Loads the Wav2Vec2 model and adds a sequence classification head.
    Initially freezes the feature encoder (CNN layers) so that only 
    the classification head is trained during Phase 1.

    Returns:
        Wav2Vec2ForSequenceClassification: The instantiated model.
    """
    model = Wav2Vec2ForSequenceClassification.from_pretrained(
        MODEL_NAME,
        num_labels=NUM_LABELS,
        label2id=LABEL2ID,
        id2label=ID2LABEL,
        ignore_mismatched_sizes=True,
        # Dropout for hidden states and attention
        hidden_dropout=0.1,
        attention_dropout=0.1,
        # Classifier dropout
        classifier_proj_size=256,
    )

    # Phase 1: Freeze feature encoder (CNN layers in the bottom)
    model.freeze_feature_encoder()
    print("[Model] Feature encoder frozen — Phase 1 ready")

    total_params = sum(p.numel() for p in model.parameters())
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"[Model] Total params: {total_params:,}")
    print(f"[Model] Trainable params (Phase 1): {trainable_params:,}")

    return model


def unfreeze_all(model: Wav2Vec2ForSequenceClassification) -> None:
    """
    Unfreezes all parameters for full fine-tuning (Phase 2).

    Args:
        model (Wav2Vec2ForSequenceClassification): The model to unfreeze.
    """
    for param in model.parameters():
        param.requires_grad = True

    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"[Model] All layers unfrozen — Trainable params (Phase 2): {trainable_params:,}")


# ============================================================
# 2. Custom Trainer with Weighted Loss
# ============================================================
class WeightedTrainer(Trainer):
    """
    Custom Trainer that overrides compute_loss to use a 
    Weighted Cross-Entropy loss function to handle class imbalance.
    """

    def __init__(self, class_weights: torch.Tensor, *args: Any, **kwargs: Any):
        super().__init__(*args, **kwargs)
        self.class_weights = class_weights

    def compute_loss(self, model: nn.Module, inputs: Dict[str, torch.Tensor], return_outputs: bool = False, **kwargs: Any) -> Any:
        labels = inputs.pop("labels")
        outputs = model(**inputs)
        logits = outputs.logits

        # Weighted loss with label smoothing
        weights = self.class_weights.to(logits.device)
        loss_fn = nn.CrossEntropyLoss(weight=weights, label_smoothing=0.1)
        loss = loss_fn(logits, labels)

        return (loss, outputs) if return_outputs else loss


# ============================================================
# 3. Evaluation Metrics
# ============================================================
def compute_metrics(eval_pred: Tuple[np.ndarray, np.ndarray]) -> Dict[str, float]:
    """
    Computes accuracy and F1 scores for evaluation.

    Args:
        eval_pred (Tuple[np.ndarray, np.ndarray]): Tuple containing logits and labels.

    Returns:
        Dict[str, float]: Dictionary containing computed metrics.
    """
    logits, labels = eval_pred
    preds = np.argmax(logits, axis=-1)

    acc = accuracy_score(labels, preds)
    f1_macro = f1_score(labels, preds, average="macro")
    f1_wtd = f1_score(labels, preds, average="weighted")

    return {
        "accuracy": round(float(acc), 4),
        "f1_macro": round(float(f1_macro), 4),
        "f1_weighted": round(float(f1_wtd), 4),
    }

