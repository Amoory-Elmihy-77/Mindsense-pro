import json
import os
from groq import Groq

from .stt import transcribe_audio
from .tts import generate_speech
from .conversation_engine import conversation_engine
from .language_detector import resolve_response_language, get_clarification_response
from .language_utils import normalize_preferred_setting, preferred_to_response_language

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def _parse_voice_settings(context: dict) -> dict:
    return context.get("voice_settings") or {}


class ResponseGenerator:
    async def generate_turn(self, session_id: str, audio_bytes: bytes, context: dict) -> dict:
        voice_settings = _parse_voice_settings(context)
        preferred = normalize_preferred_setting(
            voice_settings.get("preferred_language", "egyptian_arabic")
        )
        auto_detect = bool(voice_settings.get("auto_detect", False))
        voice_style = voice_settings.get("voice_style", "warm")
        speed = voice_settings.get("speed", 100)

        locked_language = preferred_to_response_language(preferred)
        effective_language = context.get("language") or locked_language

        if not auto_detect:
            effective_language = locked_language
            context = {
                **context,
                "language": locked_language,
                "language_locked": True,
                "voice_settings": {**voice_settings, "auto_detect": False},
            }

        user_text = ""
        detection = None

        if audio_bytes:
            transcription = transcribe_audio(
                audio_bytes,
                preferred_language=preferred,
                auto_detect=auto_detect,
            )
            detection = transcription.detection
            user_text = transcription.text

            if auto_detect and detection.needs_clarification:
                clarification = get_clarification_response(preferred)
                effective_language = resolve_response_language(detection, preferred, auto_detect)
                response_audio = await generate_speech(
                    clarification,
                    effective_language,
                    voice_style,
                    preferred,
                    speed,
                )
                return {
                    "transcript": user_text,
                    "response_text": clarification,
                    "audio_bytes": response_audio,
                    "language_info": detection.to_dict(),
                }

            if auto_detect:
                effective_language = resolve_response_language(detection, preferred, auto_detect)
                context = {
                    **context,
                    "language": effective_language,
                    "detected_language": detection.language,
                    "language_locked": False,
                }
            else:
                effective_language = locked_language
                context = {
                    **context,
                    "language": locked_language,
                    "language_locked": True,
                }

        response_text = conversation_engine.generate_response(session_id, user_text, context)

        response_audio = await generate_speech(
            response_text,
            effective_language,
            voice_style,
            preferred,
            speed,
        )

        result = {
            "transcript": user_text,
            "response_text": response_text,
            "audio_bytes": response_audio,
        }
        if detection:
            result["language_info"] = detection.to_dict()
        return result

    def generate_summary(self, session_history: list) -> dict:
        if not session_history:
            return {
                "emotion_change": "No change",
                "topics": [],
                "insights": [],
                "next_actions": [],
                "score": 0,
            }

        history_text = "\n".join([f"{msg['role']}: {msg['content']}" for msg in session_history])

        prompt = f"""قم بتحليل المحادثة التالية واستخرج ملخصاً منظماً. 
المحادثة:
{history_text}

استخرج البيانات بصيغة JSON فقط:
{{
  "emotion_change": "تغير الحالة المزاجية باختصار (مثلاً: من التوتر للهدوء)",
  "topics": ["موضوع 1", "موضوع 2"],
  "insights": ["استنتاج 1 عن حالة المستخدم", "استنتاج 2"],
  "next_actions": ["خطوة مقترحة 1", "خطوة مقترحة 2"],
  "score": تقييم جودة وتفاعل المستخدم من 0 إلى 100 كرقم
}}
"""
        try:
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0.3,
            )
            return json.loads(completion.choices[0].message.content)
        except Exception as e:
            print(f"Summary Generation Error: {e}")
            return {
                "emotion_change": "Error",
                "topics": [],
                "insights": [],
                "next_actions": [],
                "score": 0,
            }


response_generator = ResponseGenerator()
