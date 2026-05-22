# Speech Emotion Recognition — MindSense AI
## Voice Emotion Classification: Natural / Angry / Happy / Sad

---

## Table of Contents

```text
ser_project/
├── config.py          ← Hyperparameters & Settings
├── data_utils.py      ← RAVDESS Loader + Augmentation + PyTorch Dataset
├── model_utils.py     ← Model Builder + Custom Trainer + Metrics
├── train.py           ← Full Training Pipeline
├── predict.py         ← Inference Script
├── requirements.txt   ← Required Packages
└── README.md          ← This file
```

---

## Step 1: Install Dependencies

```bash
pip install -r requirements.txt
```

---

## Step 2: Download the RAVDESS Dataset

1. Visit: https://www.kaggle.com/datasets/uwrfkaggler/ravdess-emotional-speech-audio
2. Download and extract the archive.
3. You should have a `RAVDESS` directory containing the `.wav` files.

**Or via Kaggle CLI:**
```bash
pip install kaggle
kaggle datasets download -d uwrfkaggler/ravdess-emotional-speech-audio
unzip ravdess-emotional-speech-audio.zip -d ./RAVDESS
```

---

## Step 3: Training

```bash
python train.py --data_dir ./RAVDESS
```

**Approximate Training Time:**
- On GPU (e.g., T4 on Colab or RTX 4050): ~2-3 hours
- On CPU: Not recommended

> **Note:** For a smoother experience, you can use the provided `Train_on_Colab.ipynb` notebook to train the model directly on Google Colab using a free T4 GPU.

---

## Step 4: Inference

```bash
python predict.py --audio ./test_audio.wav
```

**Example Output:**
```text
========================================
  Predicted Emotion : ANGRY
========================================
  Probabilities:
    neutral  0.0312  ████
    angry    0.8941  ██████████████████████████
    happy    0.0421  █
    sad      0.0326  █
========================================
```

---

## Why does this model achieve high accuracy?

### Model: `facebook/wav2vec2-large-robust` / `facebook/wav2vec2-base`
- Trained on millions of hours of real-world speech using self-supervised learning.
- The `robust` version was trained on noisy audio, making it less sensitive to background noise.

### Training Strategy (2-Phase)
- **Phase 1:** Train only the classification head (CNN encoder frozen) → The model learns the task first without destroying pre-trained weights.
- **Phase 2:** Unfreeze all layers and fine-tune with a smaller learning rate → Higher accuracy.

### Data Augmentation
- Gaussian Noise
- Time Stretch
- Pitch Shift
- Room Reverb Simulation
- Random Time Shift

### Weighted Cross-Entropy + Label Smoothing
- Effectively handles class imbalance.
- Label smoothing prevents overconfidence.

### Cosine LR Scheduler
- Decays the learning rate smoothly, leading to more stable training.

---

## Expected Performance on RAVDESS (4 classes)

| Metric | Expected |
|--------|----------|
| Test Accuracy | 85% — 92% |
| F1 Macro | 84% — 91% |

---

## Further Improvements

1. **Add CREMA-D** to the training data (7,442 additional files).
2. **Try** `jonatasgrosman/wav2vec2-large-xlsr-53-english` (already fine-tuned on emotion).
3. **Ensemble** multiple different models for robust predictions.
