# MindSense Voice Companion API

## Backend Endpoints (`/api/v1/voice`)

### `GET /settings`
Returns persisted voice preferences (creates defaults on first access).

**Response:**
```json
{
  "status": "success",
  "data": {
    "preferredLanguage": "egyptian_arabic",
    "autoDetect": true,
    "voiceStyle": "warm",
    "speed": 100
  }
}
```

### `PATCH /settings`
Updates voice preferences.

**Request Body:** `{ "preferredLanguage": "english", "autoDetect": true, "voiceStyle": "calm", "speed": 110 }`

### `POST /settings/preview`
Generates a short TTS sample with the given (or saved) settings.

**Request Body:** `{ "preferredLanguage": "egyptian_arabic", "voiceStyle": "warm", "speed": 100 }`

**Response:**
```json
{
  "status": "success",
  "data": {
    "audioBase64": "...",
    "sampleText": "أهلًا، أنا هنا عشان أسمعك..."
  }
}
```

### `POST /session/start`
Starts a new voice companion session. Uses saved voice settings (language, auto-detect, TTS voice, speed).

- **Request Body:** `{ "emotion": "Neutral" }`
- **Response:**
```json
{
  "status": "success",
  "data": {
    "sessionId": "12345",
    "greetingAudio": "base64...",
    "greetingText": "Hello, how are you?",
    "remainingMinutes": 9.5
  }
}
```

### `POST /session/message`
Processes user audio and returns AI response. Language is detected when `autoDetect` is enabled.

- **Content-Type:** `multipart/form-data`
- **Fields:** `sessionId`, `emotion`, `audio` (file)
- **Response:**
```json
{
  "status": "success",
  "data": {
    "transcript": "User text...",
    "responseAudio": "base64...",
    "responseText": "AI text...",
    "remainingMinutes": 9.0
  }
}
```

### `POST /session/end`
Ends the session and returns a summary.

- **Request Body:** `{ "sessionId": "12345" }`

### `GET /history?limit=20`
Returns session history for the user.

### `GET /subscription/check`
Returns current usage and quota status.

## Language behavior

| Setting | Behavior |
|---------|----------|
| `autoDetect: false` (default) | Whisper, LLM, and TTS all use `preferredLanguage` only. |
| `autoDetect: true` | Mirrors detected speech (English, Egyptian, or mixed). |
| Low STT confidence (< 0.85, auto-detect on) | Companion asks: «نكمل بالمصري ولا الإنجليزي؟» |

## AI Service (`/companion`)

Voice settings are passed as JSON in form field `voice_settings`:

```json
{
  "preferred_language": "egyptian_arabic",
  "auto_detect": true,
  "voice_style": "warm",
  "speed": 100
}
```

Additional endpoint: `POST /companion/tts/preview` for voice samples.
