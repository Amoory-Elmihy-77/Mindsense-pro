<div align="center">

# 🧠 MindSense Pro

### AI-Powered Mental Health & Emotional Wellness Platform

[![CI](https://github.com/<org>/Mindsense-pro/actions/workflows/ci.yml/badge.svg)](https://github.com/<org>/Mindsense-pro/actions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](#license)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://python.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.136-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)

> **Track emotions. Understand patterns. Build healthier habits.**
>
> MindSense transforms everyday emotional signals into meaningful wellness insights, intelligent recommendations, and supportive human‑centered experiences.

**Graduation Project — Class of 2026**

[Getting Started](#-getting-started) · [Features](#-features) · [Architecture](#-architecture) · [API Reference](#-api-reference) · [Deployment](#-docker-deployment) · [Team](#-team)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Docker Deployment](#-docker-deployment)
- [API Reference](#-api-reference)
- [AI Models & Pipeline](#-ai-models--pipeline)
- [Security & Privacy](#-security--privacy)
- [Team](#-team)
- [License](#-license)

---

## 🌟 Overview

MindSense Pro is a full‑stack **AI‑powered mental health and emotional wellness platform** that helps users monitor their emotional state, analyze mood patterns, receive smart recommendations, build better habits, and connect with supportive communities.

The platform combines a modern **React** frontend with a **Node.js/Express** backend, **MongoDB** for persistent storage, and a **Python/FastAPI** AI service that performs real‑time multimodal emotion recognition (face + voice), RAG‑based psychological interventions, and an intelligent voice companion.

### Why MindSense?

| Challenge | MindSense Solution |
|---|---|
| Untracked emotions | Daily mood logging with AI‑powered sentiment analysis |
| Delayed support | Real‑time crisis detection & safety interventions |
| Lack of personal insight | Behavioral analytics connecting mood with sleep, habits & triggers |
| Productivity decline | Gamification, habit tracking & AI‑generated productivity tips |
| Social isolation | Community circles, buddy system & group sessions |
| Limited access to specialists | Professional marketplace with session booking |

---

## ✨ Features

### 🎭 Multimodal Emotion Recognition
- **Facial Expression Analysis** — Real‑time emotion detection using MTCNN face detection + fine‑tuned image classification
- **Voice Tone Analysis** — Speech Emotion Recognition via fine‑tuned Wav2Vec2 model (99.3% eval accuracy on TESS + CREMA‑D)
- **Entropy‑Based Fusion Engine** — Dynamic weighted fusion of face & voice modalities using Shannon entropy for confidence‑aware blending

### 🤖 AI Voice Companion
- Conversational AI companion with emotional context awareness
- Automatic language detection (Arabic/English) with bilingual support
- Crisis detection & safety‑first response handling
- Text‑to‑Speech (TTS) and Speech‑to‑Text (STT) integration
- Session memory & conversation context management
- Subscription‑gated usage with rate limiting

### 📊 Smart Analytics Dashboard
- Emotion trend visualization with rolling averages
- Critical day detection (sharp mood shifts)
- Predictive mood insights & behavioral correlations
- Habit‑mood correlation analysis
- Exportable mental health reports

### 📝 Emotion Tracking & Smart Journal
- Daily mood check‑ins with intensity, notes & tags
- AI‑powered sentiment analysis on journal entries
- Historical emotion timeline with filtering
- Trigger pattern identification

### 💪 Habit Tracking & Gamification
- Custom habit creation with streak tracking
- 9 therapeutic mini‑games (Breathing Game, Memory Match, Focus Flow, etc.)
- Badges, challenges & leaderboard system
- Points & rewards for consistent wellness engagement

### 👥 Community & Social Features
- Community circles with post/comment/react functionality
- Buddy system for peer accountability
- Reflection rooms for group conversations
- Community challenges & group sessions
- AI‑assisted content moderation
- Notification system for community activity

### 👨‍⚕️ Professional Marketplace
- Browse & book sessions with verified professionals
- Professional dashboard for managing bookings & clients
- Session booking with payment proof upload
- Review & rating system
- Wallet & transaction management

### 🔐 Authentication & Security
- JWT‑based authentication with role‑based access control
- Email verification & secure password reset flow
- Subscription management (free/premium tiers)
- CORS, Helmet & request sanitization

---

## 🏗 Architecture

```mermaid
graph TB
    subgraph Client["🖥️ Frontend (Port 3000)"]
        UI[React 19 + Vite 8]
        Zustand[Zustand State Management]
        Recharts[Recharts Visualizations]
    end

    subgraph Backend["⚙️ Backend (Port 5020)"]
        Express[Express 5 REST API]
        Auth[JWT Auth Middleware]
        Mongoose[Mongoose ODM]
        Realtime[WebSocket Hub]
    end

    subgraph AI["🤖 AI Service (Port 8000)"]
        FastAPI[FastAPI Server]
        Face[Face Recognition<br/>MTCNN + CNN]
        Voice[Voice Recognition<br/>Wav2Vec2]
        Fusion[Entropy-Based<br/>Fusion Engine]
        RAG[RAG Pipeline<br/>LangChain + FAISS]
        Companion[Voice Companion<br/>STT/TTS + LLM]
    end

    subgraph Data["🗄️ Database"]
        MongoDB[(MongoDB Atlas)]
    end

    UI -->|REST API| Express
    Express -->|HTTP| FastAPI
    Express -->|Mongoose| MongoDB
    FastAPI --> Face
    FastAPI --> Voice
    Face --> Fusion
    Voice --> Fusion
    Fusion --> RAG
    FastAPI --> Companion
    RAG -->|Groq LLM| LLM[Groq Cloud]
```

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | Component‑based UI framework |
| **Vite 8** | Lightning‑fast build tooling |
| **React Router 7** | Client‑side routing & navigation |
| **Zustand 5** | Lightweight state management |
| **Recharts 3** | Data visualization & charts |
| **Lucide React** | Modern icon system |
| **Axios** | HTTP client for API communication |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js 20** | Server runtime |
| **Express 5** | REST API framework |
| **MongoDB + Mongoose 8** | Document database & ODM |
| **JWT (jsonwebtoken)** | Stateless authentication |
| **bcryptjs** | Secure password hashing |
| **Multer** | File upload handling |
| **Nodemailer** | Email verification & password reset |
| **Helmet** | HTTP security headers |
| **Morgan** | Request logging |

### AI / ML
| Technology | Purpose |
|---|---|
| **Python 3.11** | AI service runtime |
| **FastAPI + Uvicorn** | High‑performance inference API |
| **PyTorch 2.3** | Deep learning framework |
| **Wav2Vec2 (Transformers)** | Speech emotion recognition |
| **MTCNN (facenet‑pytorch)** | Face detection |
| **MediaPipe** | Facial landmark analysis |
| **OpenCV** | Image preprocessing |
| **LangChain + Groq** | RAG pipeline & LLM integration |
| **FAISS** | Vector similarity search |
| **Sentence Transformers** | Text embeddings for RAG |
| **Edge‑TTS** | Text‑to‑Speech synthesis |
| **Librosa** | Audio feature extraction |

### DevOps
| Technology | Purpose |
|---|---|
| **Docker + Compose** | Containerized multi‑service deployment |
| **GitHub Actions** | CI pipeline (lint, build, dependency check) |
| **Nginx** | Frontend production reverse proxy |

---

## 📂 Project Structure

```
Mindsense-pro/
├── 📁 ai/                          # Python AI Service
│   ├── server.py                    # FastAPI entry point — all inference endpoints
│   ├── config.py                    # Central configuration (model paths, thresholds)
│   ├── requirements.txt             # Python dependencies
│   ├── Dockerfile                   # AI container image
│   ├── 📁 Models/                   # AI Models Package
│   │   ├── __init__.py              # Clean model exports
│   │   ├── face_recognition.py      # Facial expression classification (MTCNN + CNN)
│   │   ├── voice_recognition.py     # Speech emotion recognition (Wav2Vec2)
│   │   └── 📁 ser_output/           # Voice model weights (downloaded separately)
│   ├── 📁 Rag/                      # RAG Pipeline
│   │   ├── knowledge_base.py        # FAISS vector store + LangChain retrieval
│   │   └── protocols.pdf            # Mental health knowledge source
│   ├── 📁 voice_companion/          # Voice Companion Module
│   │   ├── voice_router.py          # FastAPI router for companion endpoints
│   │   ├── conversation_engine.py   # Multi-turn conversation management
│   │   ├── response_generator.py    # LLM response generation
│   │   ├── prompt_manager.py        # System prompt templates
│   │   ├── context_builder.py       # User context aggregation
│   │   ├── session_manager.py       # Session lifecycle management
│   │   ├── memory_engine.py         # Conversation memory & history
│   │   ├── crisis_detector.py       # Crisis keyword detection & safety
│   │   ├── safety.py                # Safety filters & guardrails
│   │   ├── language_detector.py     # Arabic/English language detection
│   │   ├── language_utils.py        # Language utility functions
│   │   ├── stt.py                   # Speech‑to‑Text integration
│   │   ├── tts.py                   # Text‑to‑Speech (Edge‑TTS)
│   │   ├── voice_selector.py        # Voice profile selection
│   │   ├── subscription_guard.py    # Subscription tier enforcement
│   │   ├── usage_limiter.py         # Rate limiting
│   │   └── analytics.py             # Voice session analytics
│   └── 📁 Drive Mode/              # Experimental driving mode
│       └── drive_mode.py
│
├── 📁 back/                         # Node.js Backend Service
│   ├── server.js                    # Entry point — DB connection + HTTP server
│   ├── package.json                 # Node dependencies
│   ├── Dockerfile                   # Backend container image
│   └── 📁 src/
│       ├── app.js                   # Express app — middleware & route mounting
│       ├── 📁 controllers/          # Request handlers
│       │   ├── authController/      # Login, signup, verify, password reset
│       │   ├── emotionController.js # Emotion CRUD & analysis
│       │   ├── userController.js    # Profile management
│       │   ├── voiceController.js   # Voice companion proxy
│       │   ├── voiceSettingsController.js
│       │   ├── sessionController.js # Professional session management
│       │   ├── professionalController.js
│       │   ├── communityController.js # Community features
│       │   ├── gamificationController.js
│       │   └── interventionController.js
│       ├── 📁 models/               # Mongoose schemas (26 models)
│       │   ├── User.js              # User profile & auth
│       │   ├── Emotion.js           # Emotion records
│       │   ├── Subscription.js      # Subscription plans
│       │   ├── VoiceSession.js      # Voice companion sessions
│       │   ├── CommunityPost.js     # Community posts
│       │   ├── Circle.js            # Community circles
│       │   ├── Challenge.js         # Gamification challenges
│       │   ├── SessionBooking.js    # Professional bookings
│       │   └── ...                  # 18 more models
│       ├── 📁 routes/               # Express route definitions (17 routers)
│       ├── 📁 services/             # Business logic layer (14 services)
│       ├── 📁 middlewares/          # Auth, subscription, upload guards
│       ├── 📁 repositories/         # Data access layer
│       ├── 📁 realtime/             # WebSocket hub for community
│       └── 📁 utils/                # JWT factory, email sender
│
├── 📁 front/                        # React Frontend
│   ├── index.html                   # SPA entry point
│   ├── package.json                 # Frontend dependencies
│   ├── vite.config.js               # Vite configuration
│   ├── Dockerfile                   # Frontend container (Nginx)
│   ├── nginx.conf                   # Nginx reverse proxy config
│   └── 📁 src/
│       ├── App.jsx                  # Root component — routing & layout
│       ├── main.jsx                 # React DOM mount point
│       ├── 📁 pages/               # Application pages (18 pages)
│       │   ├── Dashboard.jsx        # Main wellness dashboard
│       │   ├── EmotionTracker.jsx   # Real‑time emotion detection
│       │   ├── Analytics.jsx        # Mood analytics & trends
│       │   ├── VoiceCompanion.jsx   # AI voice companion UI
│       │   ├── Community.jsx        # Community feed & circles
│       │   ├── Games.jsx            # Therapeutic mini‑games
│       │   ├── Profile.jsx          # User profile management
│       │   ├── ProfessionalDashboard.jsx
│       │   ├── ProfessionalMarketplace.jsx
│       │   ├── MySessions.jsx       # Session booking management
│       │   └── ...                  # Auth pages (Login, Signup, etc.)
│       ├── 📁 components/           # Reusable UI components
│       │   ├── Sidebar.jsx          # Navigation sidebar
│       │   ├── Topbar.jsx           # Top navigation bar
│       │   ├── InteractiveAdvice.jsx # AI advice display
│       │   ├── BookingModal.jsx     # Session booking modal
│       │   ├── VoiceSettingsModal.jsx
│       │   ├── 📁 games/           # 9 therapeutic mini-games
│       │   │   ├── BreathingGame.jsx
│       │   │   ├── MemoryMatch.jsx
│       │   │   ├── FocusFlow.jsx
│       │   │   ├── BalloonPop.jsx
│       │   │   ├── IceBreaker.jsx
│       │   │   ├── PatternChain.jsx
│       │   │   ├── SortingStorm.jsx
│       │   │   ├── SpeedTap.jsx
│       │   │   └── WordBuilder.jsx
│       │   └── 📁 ui/              # Generic UI primitives
│       ├── 📁 store/               # Zustand state stores
│       │   ├── useAuthStore.js
│       │   ├── useEmotionStore.js
│       │   ├── useAnalyticsStore.js
│       │   ├── useVoiceStore.js
│       │   ├── useCommunityStore.js
│       │   ├── useGameStore.js
│       │   └── useSubscriptionStore.js
│       ├── 📁 styles/              # CSS stylesheets
│       └── 📁 lib/                 # Shared utilities
│
├── docker-compose.yml               # Multi‑service orchestration
├── .env.example                     # Environment variable template
├── .github/workflows/ci.yml        # GitHub Actions CI pipeline
├── .gitignore
├── .dockerignore
└── PROJECT_OVERVIEW.md              # Detailed project documentation
```

---

## 🚀 Getting Started

### Prerequisites

| Requirement | Version |
|---|---|
| **Node.js** | ≥ 20.x |
| **Python** | ≥ 3.11 |
| **MongoDB** | Atlas cluster or local instance |
| **Groq API Key** | [Get one here](https://console.groq.com/) |

### 1. Clone the Repository

```bash
git clone https://github.com/<org>/Mindsense-pro.git
cd Mindsense-pro
```

### 2. Backend Setup

```bash
cd back
npm install

# Create environment file
cp ../.env.example .env
# Edit .env with your MongoDB URI, JWT secret, and email credentials

# Start development server
npm run dev
```

The backend runs at **http://localhost:5020**.

### 3. Frontend Setup

```bash
cd front
npm install

# Start development server
npm run dev
```

The frontend runs at **http://localhost:5173** (Vite default).

### 4. AI Service Setup

```bash
cd ai

# Create virtual environment
python -m venv venv

# Activate (Windows)
.\venv\Scripts\activate

# Activate (Linux / macOS)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
echo "GROQ_API_KEY=your-groq-api-key" > .env

# Start AI server
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

The AI service runs at **http://localhost:8000**.

### ⚠️ Voice Model Download (Required)

The Wav2Vec2 model weights (~350MB) exceed GitHub's file size limits and must be downloaded separately:

1. **Download** the model from [Google Drive](https://drive.google.com/file/d/1UE0JN56y2R2avnD23H1TgWkX63ZTCf0b/view?usp=drive_link)
2. **Extract** into `ai/Models/ser_output/final_model/`
3. **Verify** these files exist:
   - `model.safetensors`
   - `config.json`
   - `preprocessor_config.json`

### ⚠️ RAG Knowledge Base (Required)

The AI service requires `ai/Rag/protocols.pdf` at startup. This file contains mental health protocols used by the RAG pipeline for generating contextual interventions.

---

## 🔐 Environment Variables

Create a `.env` file in each service directory. Use `.env.example` at the root as a reference.

### Backend (`back/.env`)

```env
PORT=5020
NODE_ENV=development
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/?appName=Mindsense
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=90d
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
AI_BASE_URL=http://localhost:8000
VOICE_DEV_UNLIMITED=true     # Set to false to test real subscription limits
```

### AI Service (`ai/.env`)

```env
GROQ_API_KEY=your-groq-api-key
```

> ⚠️ **Never commit `.env` files.** They are excluded via `.gitignore`.

---

## 🐳 Docker Deployment

Run the entire stack with a single command:

```bash
# Build and start all services
docker compose up --build -d
```

### Service Ports

| Service | Stack | Port | URL |
|---|---|---|---|
| **Frontend** | Vite + React + Nginx | `3000` | [http://localhost:3000](http://localhost:3000) |
| **Backend** | Node.js + Express | `5020` | [http://localhost:5020](http://localhost:5020) |
| **AI Service** | FastAPI + PyTorch | `8000` | [http://localhost:8000](http://localhost:8000) |

### Internal Service Wiring

- `back` → AI via Docker network: `http://ai:8000`
- `front` → Backend via host: `http://localhost:5020/api`

### Useful Commands

```bash
# View live logs (all services)
docker compose logs -f

# View logs for a specific service
docker compose logs -f ai

# Stop containers
docker compose stop

# Remove containers and network
docker compose down

# Rebuild a single service
docker compose up --build -d ai
```

### Troubleshooting

| Problem | Fix |
|---|---|
| `ai` container exits immediately | Verify `GROQ_API_KEY` in `ai/.env` and ensure `ai/Rag/protocols.pdf` exists |
| `back` cannot connect to DB | Check `MONGO_URI` in `back/.env` |
| Frontend loads but API calls fail | Run `docker compose logs -f back` and check for errors |
| Voice analysis returns errors | Ensure voice model files exist in `ai/Models/ser_output/final_model/` |

---

## 📡 API Reference

### AI Service Endpoints (`POST`)

| Endpoint | Description | Input |
|---|---|---|
| `/analyze-face` | Facial emotion recognition | `file` (image) |
| `/analyze-voice` | Voice emotion recognition | `file` (audio WAV) |
| `/analyze-all` | Multimodal fusion (face + voice) + AI advice | `face` + `voice` (files) |
| `/get-advice` | RAG‑based psychological intervention | `{ state, goal?, context?, language? }` |
| `/analyze-trends` | Behavioral trend analysis | `{ user_emotions[], time_range }` |
| `/companion/*` | Voice companion endpoints | Various |

### Backend REST API

| Route Prefix | Description |
|---|---|
| `/api/v1/users` | Authentication, profile, password management |
| `/api/emotion` | Emotion CRUD, analysis, history |
| `/api/intervention` | AI intervention proxy |
| `/api/v1/voice` | Voice companion session management |
| `/api/v1/professionals` | Professional profiles & search |
| `/api/v1/sessions` | Session booking & management |
| `/api/v1/gamification` | Points, badges, challenges |
| `/api/community` | Community posts & interactions |
| `/api/feed` | Community feed aggregation |
| `/api/circles` | Community circles management |
| `/api/challenges` | Challenge participation |
| `/api/buddies` | Buddy system pairing |
| `/api/rooms` | Reflection rooms |
| `/api/group-sessions` | Group session scheduling |
| `/api/leaderboard` | Gamification leaderboard |
| `/api/notifications` | Community notifications |
| `/api/moderation` | Content moderation tools |

> All protected routes require a `Bearer <token>` in the `Authorization` header.

---

## 🧮 AI Models & Pipeline

### Emotion Recognition

| Component | Architecture | Training Data | Accuracy |
|---|---|---|---|
| **Face Model** | MTCNN detection + CNN classification + MediaPipe landmarks | [facial_emotions_image_detection](https://huggingface.co/dima806/facial_emotions_image_detection) | — |
| **Voice Model** | Wav2Vec2 (2‑phase fine‑tuning) | TESS + CREMA‑D combined | **99.3%** |

### Entropy‑Based Fusion

The fusion engine dynamically weights face and voice predictions using **Shannon entropy**:

1. Compute entropy for each modality's score distribution
2. Lower entropy → higher confidence → greater weight
3. Apply confidence floor if voice confidence < 0.4
4. Re‑normalize fused scores to produce final emotion

### RAG Pipeline

```
User Input → Preprocessing → Sentiment Analysis
                                    ↓
protocols.pdf → PDF Parser → Text Chunks → Sentence Embeddings → FAISS Index
                                                                      ↓
                                                              Vector Retrieval
                                                                      ↓
                                              Context + Query → Groq LLM → Personalized Intervention
```

- **Embeddings**: Sentence Transformers (HuggingFace)
- **Vector Store**: FAISS (CPU)
- **LLM**: Groq Cloud (LLaMA)
- **Framework**: LangChain

### Voice Companion Pipeline

```
Audio Input → STT → Language Detection → Context Building → Prompt Assembly
                                                                    ↓
                                                        Crisis Detection
                                                                    ↓
                                                   LLM Response Generation
                                                                    ↓
                                                      Safety Filtering
                                                                    ↓
                                                           TTS Output
```

---

## 🔒 Security & Privacy

| Area | Implementation |
|---|---|
| **Authentication** | JWT tokens with configurable expiration |
| **Password Security** | bcryptjs hashing (never stored in plaintext) |
| **Authorization** | Role‑based access control (user, professional, admin, community_moderator) |
| **API Security** | Helmet headers, CORS policy, request validation |
| **Subscription Guard** | Middleware‑enforced tier limits for premium features |
| **Upload Security** | Multer with file type validation & size limits |
| **Environment Secrets** | `.env` files excluded from version control |
| **Crisis Safety** | AI crisis detector with safe response routing |

> ⚠️ MindSense is **not a replacement for professional therapy**. It is a supportive platform that helps users understand themselves better and encourages healthy daily actions.

---

## 👥 Team

### Project Team

| Name | Role |
|---|---|
| **Ammar Yasser Abdelghany Elmihy** | Team Member |
| **Abdelrahman Eslam Mohamed Helal** | Team Member |
| **Ebrahim Zaher Abdelbary** | Team Member |
| **Youssef Mohamed Abdelmonem** | Team Member |
| **Amr Hashish** | Team Member |
| **Adel Elshabrawy** | Team Member |
| **Shehab Elsayed** | Team Member |
| **Abdelrahman Zakaria** | Team Member |
| **Shereef Shaheen** | Team Member |
| **Ahmed Talat** | Team Member |

### Academic Supervision

| Name | Role |
|---|---|
| **Dr. Amal Abo Eleneen** | Project Supervisor |
| **Ghada Shafeeq** | Teaching Assistant |

---

## 📄 License

This project was developed as a **Graduation Project — Class of 2026**.

---

<div align="center">

### 🧠 MindSense Pro

**A smarter path to emotional awareness, wellness, and growth.**

Built with ❤️ by the MindSense Team

</div>