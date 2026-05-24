# MindSense AI 🧠🤖
> **Real-time Multimodal Emotion & Psychological State Detection System**

An integrated Artificial Intelligence application that leverages **Computer Vision** and **Audio Natural Language Processing (NLP)** to analyze a user's psychological and emotional state in real-time based on facial expressions and voice tone.

---

## 🚀 Features

- **Multimodal Fusion:** Combines facial and vocal analysis results to ensure higher accuracy and mitigate edge cases (e.g., loud laughter misclassified as anger).
- **Advanced Audio Processing:** Utilizes a fine-tuned **Wav2Vec2** architecture enhanced with engineering heuristics such as silence trimming and confidence weights to handle overlapping emotional extremities.
- **Clean Architecture:** Complete separation of configurations into a central `config.py` file and adoption of the Singleton design pattern to load models into memory efficiently.
- **High-Performance Backend:** Powered by **FastAPI** to provide instantaneous responses and handle real-time data streams.

---

## 📂 Project Structure

```text
📁 ai/
 │
 ├── 📄 config.py                 # Central configuration file
 ├── 📄 server.py                 # Main FastAPI server
 ├── 📄 requirements.txt          # Project dependencies
 ├── 📄 .gitignore                # Excluded large files and caches
 │
 └── 📁 Models/                   # AI Models Package
      ├── 📄 __init__.py           # Module initialization and clean exports
      ├── 📄 face_recognition.py   # Facial expression processing and classification
      ├── 📄 voice_recognition.py  # Voice tone processing and classification
      │
      └── 📁 ser_output/           # Local Voice Model (Downloaded separately)
           └── 📁 final_model/
                ├── config.json
                ├── preprocessor_config.json
                └── model.safetensors
```

---

## 🛠️ Setup & Installation

### 1. Environment Setup

Open your terminal in the root directory of the project and run:

```bash
# Create a virtual environment
python -m venv venv

# Activate the environment (Windows)
.\venv\Scripts\activate

# Activate the environment (Linux/Mac)
source venv/bin/activate

# Install required dependencies
pip install -r requirements.txt
```

---

### ⚠️ 2. Downloading the Voice Model (CRITICAL)

Due to the large file size of the voice model weights exceeding GitHub's strict limits, the model directory is **excluded from this repository**. Please follow these steps:

1. Download the compressed model file from **[INSERT YOUR GOOGLE DRIVE LINK HERE]**.
2. Extract the archive and place its contents into the following path:
   ```
   Models/ser_output/final_model/
   ```
3. Verify that the following files are present before proceeding:
   - `model.safetensors`
   - `config.json`
   - `preprocessor_config.json`

---

## 💻 Running the Application

Make sure you are in the root directory (`ai/`) with your virtual environment activated, then use any of the following commands:

```bash
# Test the voice model independently
python Models/voice_recognition.py

# Test the face model independently
python Models/face_recognition.py

# Run the full real-time server
uvicorn server:app --reload
```

---

## 🧮 Datasets & Models

| Component | Details |
|-----------|---------|
| **Voice Model** | Built on the `Wav2Vec2` architecture, fine-tuned across two phases using a combined dataset of **TESS** (University of Toronto) and **CREMA-D**. Achieves **99.3% evaluation accuracy**, successfully mitigating common dataset biases (e.g., Sad Bias). |
| **Face Model** | Relies on real-time landmarking and expression classification, strictly tuned to evaluate the core target emotions to seamlessly integrate with the audio pipeline. |

---

## 🐳 Docker Deployment

This section explains how to quickly run the full **MindSense Pro** stack (Frontend + Backend + AI) using Docker Compose.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed.
- [Docker Compose](https://docs.docker.com/compose/install/) installed.

### Services

| Service | Stack | Port |
|---------|-------|------|
| `front` | Vite + React | `3000` |
| `back` | Node.js + Express | `5020` |
| `ai` | FastAPI + ML inference | `8000` |

---

### 🔧 Environment Setup

Before starting containers, make sure these files exist and are valid.

#### 1) Backend environment (`back/.env`)

```env
PORT=5020
MONGO_URI="your_mongodb_connection_string"
JWT_SECRET="your_secret_key"
JWT_EXPIRES_IN=90d
EMAIL_USERNAME="your_email@gmail.com"
EMAIL_PASSWORD="your_email_app_password"
```

#### 2) AI environment (`ai/.env`)

```env
GROQ_API_KEY=your_groq_api_key
```

> ⚠️ Use `KEY=value` format with no spaces around `=`.

#### 3) Required AI knowledge file

The AI service expects this file at startup:

```
ai/Rag/protocols.pdf
```

If this file is missing, the AI container will fail to start.

---

### ▶️ Running the Application

From the repo root (where `docker-compose.yml` lives):

```bash
docker compose up --build -d
```

- `--build` — builds fresh images for all services.
- `-d` — runs containers in detached mode.

### 🌐 Accessing the Apps

| Service | URL |
|---------|-----|
| Frontend | [http://localhost:3000](http://localhost:3000) |
| Backend API | [http://localhost:5020](http://localhost:5020) |
| AI API | [http://localhost:8000](http://localhost:8000) |

---

### 📋 Useful Commands

```bash
# See live logs (all services)
docker compose logs -f

# See live logs (specific service)
docker compose logs -f ai

# Stop running containers
docker compose stop

# Remove containers and network
docker compose down

# Rebuild one service only
docker compose up --build -d ai
```

---

### 🔗 Internal Service Wiring

- `back` calls AI through Docker network using `http://ai:8000`.
- `front` is built with `VITE_API_BASE_URL=http://localhost:5020/api`, so browser requests target host port `5020`.

---

### 🔍 Troubleshooting

| Problem | Fix |
|---------|-----|
| `ai` exits quickly | Verify `GROQ_API_KEY` in `ai/.env` and that `ai/Rag/protocols.pdf` exists |
| `back` cannot connect to DB | Verify `MONGO_URI` in `back/.env` |
| Frontend loads but API calls fail | Run `docker compose logs -f back` and check for errors |

---

> 💡 Developed as a **Graduation Project** — Class of 2026.