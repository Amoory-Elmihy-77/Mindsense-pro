import os
import re

from groq import Groq

from .prompt_manager import prompt_manager
from .memory_engine import memory_engine
from .safety import safety_layer
from Rag.knowledge_base import vector_db

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

ARABIC_SCRIPT_RE = re.compile(r"[\u0600-\u06FF\u0750-\u077F]")


def _is_mostly_arabic(text: str) -> bool:
    if not text or not text.strip():
        return False
    ar = len(ARABIC_SCRIPT_RE.findall(text))
    letters = len(re.findall(r"\w", text, re.UNICODE)) or 1
    return ar / letters > 0.2


class ConversationEngine:
    def __init__(self, model_name="llama-3.3-70b-versatile"):
        self.model_name = model_name

    def generate_response(self, session_id: str, user_text: str, context: dict) -> str:
        safety_status = safety_layer.check_input(user_text)
        language = context.get("language", "arabic")
        language_locked = context.get("language_locked", False)
        tts_language = "english" if language == "english" else "arabic"

        if not safety_status["is_safe"]:
            from .crisis_detector import crisis_detector

            response = crisis_detector.get_crisis_response(tts_language)
            memory_engine.add_message(session_id, "user", user_text)
            memory_engine.add_message(session_id, "assistant", response)
            return response

        if user_text:
            memory_engine.add_message(session_id, "user", user_text)

        rag_context = ""
        emotion = context.get("emotion_context", {}).get("current", "Neutral")
        if len(user_text) > 10 and language != "english":
            results = vector_db.similarity_search(f"{emotion} {user_text}", k=1)
            if results:
                rag_context = (
                    f"\n\nمعلومة إرشادية للمساعدة (لا تذكرها كنصيحة طبية، بل كاقتراح ودي): "
                    f"{results[0].page_content}"
                )

        system_prompt = prompt_manager.get_system_prompt(context) + rag_context
        messages = [{"role": "system", "content": system_prompt}]

        history = memory_engine.get_session_history(session_id)
        messages.extend(history)

        if not history and not user_text:
            messages.append({"role": "user", "content": prompt_manager.get_greeting_prompt(context)})
        elif language_locked and language == "english":
            messages.append({
                "role": "user",
                "content": (
                    "Remember: you must reply in US English only. "
                    "Never use Arabic in this response."
                ),
            })

        try:
            completion = client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                temperature=0.5 if language_locked else 0.7,
                max_tokens=150,
            )
            ai_response = completion.choices[0].message.content.strip()

            if language_locked and language == "english" and _is_mostly_arabic(ai_response):
                completion = client.chat.completions.create(
                    model=self.model_name,
                    messages=messages + [{
                        "role": "user",
                        "content": "Your last reply contained Arabic. Rewrite the same meaning in US English only.",
                    }],
                    temperature=0.3,
                    max_tokens=150,
                )
                ai_response = completion.choices[0].message.content.strip()

            safe_response = safety_layer.filter_output(ai_response, tts_language)
            memory_engine.add_message(session_id, "assistant", safe_response)
            return safe_response
        except Exception as e:
            print(f"Conversation Engine Error: {e}")
            return prompt_manager.get_safe_fallback_prompt(tts_language)


conversation_engine = ConversationEngine()
