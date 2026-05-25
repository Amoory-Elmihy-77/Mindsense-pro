# MindSense Pro - API Documentation

This document outlines the REST API endpoints available in the MindSense Pro ecosystem, covering both the Python AI microservice and the Node.js backend orchestrator.

---

## 🤖 1. AI Service Endpoints

**Base URL:** `http://localhost:8000` (or the AI container URL)

### 1.1 Face Analysis
- **Purpose:** Analyzes a facial image to detect the dominant emotion and calculate confidence scores. Used by the backend to process webcam captures.
- **Request Details:**
  - **URL:** `/analyze-face`
  - **Method:** `POST`
  - **Content-Type:** `multipart/form-data`
  - **Payload:** `file`: (`UploadFile`) The input image file (e.g., JPEG, PNG).
- **Response Details:**
  - **Status:** 200 OK
  - **Body Format:**
    ```json
    {
      "status": "success",
      "emotion": {
        "scores": { "Happy": 0.85, "Sad": 0.05, "Angry": 0.01, "Neutral": 0.09 },
        "dominant": "Happy",
        "face_detected": true
      }
    }
    ```

### 1.2 Voice Analysis
- **Purpose:** Analyzes an audio file to determine emotional tone via the custom Wav2Vec2 model. Used by the backend to process microphone recordings.
- **Request Details:**
  - **URL:** `/analyze-voice`
  - **Method:** `POST`
  - **Content-Type:** `multipart/form-data`
  - **Payload:** `file`: (`UploadFile`) The input audio file (e.g., WAV).
- **Response Details:**
  - **Status:** 200 OK
  - **Body Format:**
    ```json
    {
      "status": "success",
      "final_emotion": "Sad",
      "confidence": 0.92,
      "details": { "Happy": 0.02, "Sad": 0.92, "Angry": 0.01, "Neutral": 0.05 }
    }
    ```

### 1.3 Analyze All (Fusion + Advice)
- **Purpose:** Multi-modal analysis. Takes both face and voice data, applies Entropy-Based Dynamic Fusion to calculate a definitive mood, and triggers the RAG system to generate psychological advice.
- **Request Details:**
  - **URL:** `/analyze-all`
  - **Method:** `POST`
  - **Content-Type:** `multipart/form-data`
  - **Payload:** 
    - `face`: (`UploadFile`) The input image file.
    - `voice`: (`UploadFile`) The input audio file.
- **Response Details:**
  - **Status:** 200 OK
  - **Body Format:**
    ```json
    {
      "status": "success",
      "face": { "scores": {"...": 0}, "dominant": "Sad", "face_detected": true },
      "voice": { "scores": {"...": 0}, "final_emotion": "Sad", "confidence": 0.88 },
      "fusion": {
        "final_state": "Sad",
        "scores": {"...": 0},
        "weights": { "face": 0.55, "voice": 0.45 },
        "conflict": false
      },
      "advice": "Summary of the psychological intervention..."
    }
    ```

### 1.4 Get Advice (Intervention)
- **Purpose:** Generates a psychological intervention strategy using RAG and Groq based on a manually provided emotional state.
- **Request Details:**
  - **URL:** `/get-advice`
  - **Method:** `POST`
  - **Content-Type:** `application/json`
  - **Payload:**
    ```json
    {
      "state": "Angry"
    }
    ```
- **Response Details:**
  - **Status:** 200 OK
  - **Body Format:**
    ```json
    {
      "status": "success",
      "advice": "Your intervention sentence goes here..."
    }
    ```

### 1.5 Analyze Trends
- **Purpose:** Processes a historical sequence of emotional states to generate rolling averages, identify critical negative mood shifts, and provide AI-generated analytical insights.
- **Request Details:**
  - **URL:** `/analyze-trends`
  - **Method:** `POST`
  - **Content-Type:** `application/json`
  - **Payload:**
    ```json
    {
      "time_range": "week",
      "user_emotions": [
        { "date": "2023-11-01T10:00:00Z", "emotion": "Happy", "confidence": 0.9 },
        { "date": "2023-11-02T10:00:00Z", "emotion": "Sad", "confidence": 0.85 }
      ]
    }
    ```
- **Response Details:**
  - **Status:** 200 OK
  - **Body Format:**
    ```json
    {
      "dominant_emotion": "Neutral",
      "trend": "stable",
      "critical_days": [],
      "insights": ["..."],
      "prediction": "...",
      "rolling_average": []
    }
    ```

---

## ⚙️ 2. Backend Orchestrator (Node.js)

**Base URL:** `http://localhost:5020/api`

### 2.1 Authentication & Registration (`/v1/users`)

#### `POST /v1/users/signup`
- **Purpose:** Registers a new user account and triggers a verification email with a 6-digit code.
- **Request Details:**
  - **Content-Type:** `application/json`
  - **Payload:** 
    ```json
    { "name": "John", "email": "j@example.com", "password": "...", "passwordConfirm": "...", "age": 25 }
    ```
- **Response Details:**
  - **Status:** 201 Created
  - **Body Format:**
    ```json
    {
      "status": "success",
      "message": "Registration successful! Check your email for the activation code."
    }
    ```

#### `POST /v1/users/verify`
- **Purpose:** Verifies the user's account using the code sent via email.
- **Request Details:**
  - **Content-Type:** `application/json`
  - **Payload:** 
    ```json
    { "email": "j@example.com", "code": "123456" }
    ```
- **Response Details:**
  - **Status:** 200 OK
  - **Body Format:**
    ```json
    {
      "status": "success",
      "token": "eyJhbG...",
      "data": { "user": {} }
    }
    ```

#### `POST /v1/users/resendCode`
- **Purpose:** Generates and emails a new 6-digit verification code.
- **Request Details:**
  - **Content-Type:** `application/json`
  - **Payload:** 
    ```json
    { "email": "j@example.com" }
    ```
- **Response Details:**
  - **Status:** 200 OK
  - **Body Format:**
    ```json
    {
      "status": "success",
      "message": "A new code has been sent to your email."
    }
    ```

#### `POST /v1/users/login`
- **Purpose:** Authenticates a verified user and returns an operational JWT token for protected routes.
- **Request Details:**
  - **Content-Type:** `application/json`
  - **Payload:** 
    ```json
    { "email": "j@example.com", "password": "securepassword123" }
    ```
- **Response Details:**
  - **Status:** 200 OK
  - **Body Format:**
    ```json
    {
      "status": "success",
      "token": "eyJhbG..."
    }
    ```

*Password Reset endpoints available at `/forgotPassword`, `/verifyResetCode`, and `/resetPassword`.*

### 2.2 User Profile & Trusted Contacts (`/v1/users`)
*(Requires Authorization: Bearer `<token>`)*

#### `GET /v1/users/me`
- **Purpose:** Fetches the authenticated user's profile and settings.
- **Request Details:**
  - **Headers:** `Authorization: Bearer <token>`
- **Response Details:**
  - **Status:** 200 OK
  - **Body Format:** `{ "status": "success", "data": { "user": {} } }`

#### `PATCH /v1/users/updateMe`
- **Purpose:** Updates general profile data (e.g., name, age).
- **Request Details:**
  - **Headers:** `Authorization: Bearer <token>`
  - **Payload:** JSON Object containing fields to update.
- **Response Details:**
  - **Status:** 200 OK
  - **Body Format:** `{ "status": "success", "data": { "user": {} } }`

#### `PATCH /v1/users/updateMyPassword`
- **Purpose:** Updates the user's authentication password.
- **Request Details:**
  - **Headers:** `Authorization: Bearer <token>`
  - **Payload:** `{ "passwordCurrent": "old", "password": "new", "passwordConfirm": "new" }`
- **Response Details:**
  - **Status:** 200 OK
  - **Body Format:** `{ "status": "success", "token": "..." }`

#### `POST /v1/users/add-contact`
- **Purpose:** Initiates a request to add a trusted contact for emergency SOS alerts via email invitation.
- **Request Details:**
  - **Headers:** `Authorization: Bearer <token>`
  - **Payload:** `{ "name": "Mom", "email": "nom@example.com", "phone": "123", "relationship": "Parent" }`
- **Response Details:**
  - **Status:** 200 OK

#### `GET /v1/users/approve-contact/:token`
- **Purpose:** Public endpoint clicked by a trusted contact directly from their email to approve emergency monitoring.
- **Request Details:**
  - **URL Parameter:** `token` (Hex string attached to user document).
- **Response Details:**
  - **Status:** 200 OK (HTML/Redirect)

#### `POST /v1/users/notify-contact`
- **Purpose:** Manually requests an immediate SOS notice to be sent to approved trusted contacts.
- **Request Details:**
  - **Headers:** `Authorization: Bearer <token>`
- **Response Details:**
  - **Status:** 200 OK

### 2.3 Emotion Tracking (`/emotion`)
*(Requires Authorization: Bearer `<token>`)*

#### `POST /emotion/face`
- **Purpose:** Relays a face image to the AI service, triggers an SOS check if dangerous emotions are detected, and saves the `Emotion` document to MongoDB.
- **Request Details:**
  - **Headers:** `Authorization: Bearer <token>`
  - **Content-Type:** `multipart/form-data`
  - **Payload:** `file` (Image Upload Buffer)
- **Response Details:**
  - **Status:** 200 OK
  - **Body Format:** `{ "analysis": {...}, "emotion": {...}, "advice": "...", "contactNotified": false }`

#### `POST /emotion/voice`
- **Purpose:** Relays an audio recording to the AI service, triggers an SOS check, and saves the resulting emotion event log.
- **Request Details:**
  - **Headers:** `Authorization: Bearer <token>`
  - **Content-Type:** `multipart/form-data`
  - **Payload:** `file` (Audio Upload Buffer)
- **Response Details:**
  - **Status:** 200 OK
  - **Body Format:** `{ "analysis": {...}, "emotion": {...}, "advice": "...", "contactNotified": "success" }`

#### `POST /emotion/all`
- **Purpose:** Performs multi-modal analysis by sending both Face/Voice payloads to the AI fusion engine. Generates advice, logs to DB, and executes SOS checking.
- **Request Details:**
  - **Headers:** `Authorization: Bearer <token>`
  - **Content-Type:** `multipart/form-data`
  - **Payload:** `face` (Image Upload), `voice` (Audio Upload)
- **Response Details:**
  - **Status:** 200 OK
  - **Body Format:** `{ "analysis": {...}, "emotion": {...}, "advice": "...", "contactNotified": false }`

#### `GET /emotion/history`
- **Purpose:** Retrieves paginated historical emotion records for the user.
- **Request Details:**
  - **Headers:** `Authorization: Bearer <token>`
  - **Query Params:** 
    - `limit`: (Number) Number of records to return (default: 50).
    - `source`: (String, Optional) Filter by `face`, `voice`, or `fusion`.
    - `from`, `to`: (Date Strings) Boundaries for filtering.
- **Response Details:**
  - **Status:** 200 OK
  - **Body Format:** `{ "status": "success", "results": 50, "data": [...] }`

#### `GET /emotion/report`
- **Purpose:** Formats a grouped analysis report used primarily for frontend bar/pie charting.
- **Request Details:**
  - **Headers:** `Authorization: Bearer <token>`
  - **Query Params:**
    - `groupBy`: (String) `"weekly"` or `"daily"`.
    - `from`, `to`: (Date Strings) Filter timeframe.
- **Response Details:**
  - **Status:** 200 OK
  - **Body Format:** `{ "status": "success", "data": [ { "_id": {"day": "2023-11-01"}, "count": 3, "avgConfidence": 0.8 } ] }`

#### `GET /emotion/trends`
- **Purpose:** Retrieves behavioral analytics, emotional trends, rolling averages, and AI-generated insights via the Python AI proxy.
- **Request Details:**
  - **Headers:** `Authorization: Bearer <token>`
  - **Query Params:**
    - `timeRange`: (String) The time range to analyze, typically `"week"` or `"month"` (default: `"week"`).
- **Response Details:**
  - **Status:** 200 OK
  - **Body Format:**
    ```json
    {
      "status": "success",
      "data": {
        "dominant_emotion": "Neutral",
        "trend": "stable",
        "critical_days": [],
        "insights": ["..."],
        "prediction": "...",
        "rolling_average": []
      }
    }
    ```

#### `GET /emotion/flutter-dashboard`
- **Purpose:** Aggregates the last 7 days of emotion data separated by face and voice scans. Formats the data specifically for a stacked bar chart visualization on the Flutter mobile application and provides an AI-generated weekly emotional overview.
- **Request Details:**
  - **Headers:** `Authorization: Bearer <token>`
  - **Query Params:** None
- **Response Details:**
  - **Status:** 200 OK
  - **Body Format:**
    ```json
    {
      "status": "success",
      "data": {
        "overviewTitle": "Weekly Mood Overview",
        "overviewText": "Your mood has been generally positive this week...",
        "chartData": [
          { "day": "Mon", "faceScore": 12, "voiceScore": 8 },
          { "day": "Tue", "faceScore": 15, "voiceScore": 10 }
        ]
      }
    }
    ```

### 2.4 Interventions (`/intervention`)
*(Requires Authorization: Bearer `<token>`)*

#### `POST /intervention/`
- **Purpose:** Direct-calls the AI logic to request RAG-based advice based on an explicit manual string state without uploading media files.
- **Request Details:**
  - **Headers:** `Authorization: Bearer <token>`
  - **Content-Type:** `application/json`
  - **Payload:** `{ "state": "Sad" }`
- **Response Details:**
  - **Status:** 200 OK
  - **Body Format:** `{ "status": "success", "advice": "Take deep breaths..." }`