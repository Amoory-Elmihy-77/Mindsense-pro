import json
import os
import re

from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings


load_dotenv()

PDF_PATH = r"Rag/protocols.pdf"
GOAL_IDS = ("calm", "focus", "reflect")

if not os.path.exists(PDF_PATH):
    raise FileNotFoundError(f"PDF file not found at: {PDF_PATH}")

print("Loading MindSense intervention knowledge base...")

loader = PyPDFLoader(PDF_PATH)
pages = loader.load()
full_text = "\n".join(page.page_content for page in pages)

raw_chunks = full_text.split("Protocol:")
documents = []
for chunk in raw_chunks:
    chunk = chunk.strip()
    if len(chunk) > 20:
        documents.append(
            Document(
                page_content="Protocol:\n" + chunk,
                metadata={"source": "MindSense Performance Guide"},
            )
        )

embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
)
vector_db = FAISS.from_documents(documents, embeddings)
print(f"Extracted {len(documents)} intervention protocols.")

llm = ChatGroq(model_name="openai/gpt-oss-120b", temperature=0.7)

GOAL_LABELS = {
    "en": {
        "calm": "Calm",
        "focus": "Focus",
        "reflect": "Reflect",
    },
    "ar": {
        "calm": "هدوء",
        "focus": "تركيز",
        "reflect": "تأمل",
    },
}

BASE_PLAYBOOKS = {
    "happy": {
        "recommended_goal": "focus",
        "en": {
            "title": "Keep momentum",
            "summary": "The scan suggests a positive state, so each path protects your energy in a different way.",
        },
        "ar": {
            "title": "حافظ على الزخم",
            "summary": "التحليل يشير إلى حالة إيجابية، لذلك كل مسار يساعدك تستخدم طاقتك بطريقة مناسبة.",
        },
    },
    "sad": {
        "recommended_goal": "calm",
        "en": {
            "title": "Gentle recovery",
            "summary": "The scan suggests low mood, so each path starts gently and keeps the next step small.",
        },
        "ar": {
            "title": "تعاف هادئ",
            "summary": "التحليل يشير إلى مزاج منخفض، لذلك كل مسار يبدأ بلطف ويجعل الخطوة التالية بسيطة.",
        },
    },
    "angry": {
        "recommended_goal": "calm",
        "en": {
            "title": "Cool down",
            "summary": "The scan suggests high activation, so each path creates space before you act.",
        },
        "ar": {
            "title": "تهدئة سريعة",
            "summary": "التحليل يشير إلى انفعال عال، لذلك كل مسار يعطيك مساحة قبل أي رد فعل.",
        },
    },
    "anxious": {
        "recommended_goal": "calm",
        "en": {
            "title": "Grounding",
            "summary": "The scan suggests anxiety, so each path brings attention back to the present.",
        },
        "ar": {
            "title": "تثبيت وتهدئة",
            "summary": "التحليل يشير إلى قلق، لذلك كل مسار يرجع انتباهك للحظة الحالية.",
        },
    },
    "neutral": {
        "recommended_goal": "focus",
        "en": {
            "title": "Focus reset",
            "summary": "The scan suggests a stable state, so each path supports clarity and steady action.",
        },
        "ar": {
            "title": "إعادة ضبط التركيز",
            "summary": "التحليل يشير إلى حالة مستقرة، لذلك كل مسار يدعم الوضوح والخطوة الهادئة.",
        },
    },
}

GOAL_FALLBACKS = {
    "en": {
        "calm": {
            "label": "Calm: settle your body first",
            "plan": [
                "Take three slow exhales.",
                "Relax your jaw, shoulders, and hands.",
                "Choose one small next action after your body settles.",
            ],
            "why": "Calming first lowers emotional intensity so the next decision is less reactive.",
            "after": "Check your body again, then continue only with the smallest useful step.",
        },
        "focus": {
            "label": "Focus: turn the state into one clear action",
            "plan": [
                "Remove one distraction from your space.",
                "Pick one task for the next fifteen minutes.",
                "Start with the easiest visible step.",
            ],
            "why": "A narrow focus goal helps convert the detected emotion into a practical action.",
            "after": "Review what changed after the focused block and decide whether to continue or rest.",
        },
        "reflect": {
            "label": "Reflect: understand the signal",
            "plan": [
                "Write one sentence naming what you feel.",
                "Write one possible reason this emotion appeared.",
                "Write one kind response you can give yourself now.",
            ],
            "why": "Reflection helps the user understand the emotional signal instead of only reacting to it.",
            "after": "Keep the note short, then choose either a calm reset or a focused next step.",
        },
    },
    "ar": {
        "calm": {
            "label": "هدوء: ابدأ بتهدئة جسمك",
            "plan": [
                "خذ ثلاثة زفيرات ببطء.",
                "أرخ الفك والكتفين واليدين.",
                "اختر خطوة صغيرة بعد ما جسمك يهدأ.",
            ],
            "why": "الهدوء أولا يقلل شدة الانفعال، فيكون القرار التالي أقل اندفاعا.",
            "after": "راجع إحساس جسمك، ثم كمل بأصغر خطوة مفيدة فقط.",
        },
        "focus": {
            "label": "تركيز: حول الحالة إلى فعل واضح",
            "plan": [
                "أبعد مشتت واحد من حولك.",
                "اختر مهمة واحدة للربع ساعة القادمة.",
                "ابدأ بأسهل خطوة واضحة أمامك.",
            ],
            "why": "هدف التركيز يحول الإحساس المكتشف إلى خطوة عملية محددة.",
            "after": "بعد وقت التركيز، راجع ما تغير ثم قرر تكمل أو ترتاح.",
        },
        "reflect": {
            "label": "تأمل: افهم الإشارة",
            "plan": [
                "اكتب جملة واحدة تسمي فيها شعورك.",
                "اكتب سببا محتملا لظهور هذا الشعور.",
                "اكتب ردا لطيفا تقدر تقوله لنفسك الآن.",
            ],
            "why": "التأمل يساعد المستخدم يفهم الإشارة العاطفية بدل الاكتفاء برد فعل سريع.",
            "after": "خلي الملاحظة قصيرة، ثم اختر تهدئة أو خطوة تركيز بسيطة.",
        },
    },
}


def _normalize_state(state: str) -> str:
    normalized = str(state or "neutral").strip().lower()
    if normalized in {"fear", "stressed", "stress", "worried"}:
        return "anxious"
    return normalized if normalized in BASE_PLAYBOOKS else "neutral"


def _playbook_for_state(state: str) -> dict:
    return BASE_PLAYBOOKS[_normalize_state(state)]


def _extract_json(text: str) -> dict | None:
    if not text:
        return None

    cleaned = re.sub(
        r"^```(?:json)?|```$",
        "",
        text.strip(),
        flags=re.IGNORECASE | re.MULTILINE,
    ).strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{.*\}", cleaned, flags=re.DOTALL)
    if not match:
        return None

    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError:
        return None


def _clean_list(value, fallback: list[str]) -> list[str]:
    if not isinstance(value, list):
        return fallback

    items = [str(item).strip() for item in value if str(item).strip()]
    return items[:5] if len(items) >= 2 else fallback


def _normalize_goal_content(language: str, goal_id: str, goal_payload: dict) -> dict:
    fallback = GOAL_FALLBACKS[language][goal_id]
    goal_payload = goal_payload if isinstance(goal_payload, dict) else {}

    return {
        "label": goal_payload.get("label") or fallback["label"],
        "plan": _clean_list(goal_payload.get("plan"), fallback["plan"]),
        "why": goal_payload.get("why") or fallback["why"],
        "after": goal_payload.get("after") or fallback["after"],
    }


def _normalize_language_content(
    language: str,
    state_playbook: dict,
    payload_content: dict,
) -> dict:
    fallback = state_playbook[language]
    payload_content = payload_content if isinstance(payload_content, dict) else {}
    payload_goals = payload_content.get("goals")
    payload_goals = payload_goals if isinstance(payload_goals, dict) else {}

    goals = {
        goal_id: _normalize_goal_content(
            language,
            goal_id,
            payload_goals.get(goal_id, {}),
        )
        for goal_id in GOAL_IDS
    }

    return {
        "title": payload_content.get("title") or fallback["title"],
        "summary": payload_content.get("summary") or fallback["summary"],
        "goals": goals,
    }


def _normalize_intervention_payload(
    state: str,
    payload: dict | None,
    preferred_goal: str | None = None,
    preferred_language: str | None = None,
) -> dict:
    state_key = _normalize_state(state)
    state_playbook = _playbook_for_state(state)
    payload = payload if isinstance(payload, dict) else {}
    payload_content = payload.get("content")
    payload_content = payload_content if isinstance(payload_content, dict) else {}

    recommended_goal = str(
        preferred_goal
        or payload.get("recommended_goal")
        or state_playbook["recommended_goal"]
    ).strip().lower()
    if recommended_goal not in GOAL_IDS:
        recommended_goal = state_playbook["recommended_goal"]

    default_language = str(
        preferred_language or payload.get("default_language") or "en"
    ).strip().lower()
    if default_language not in {"en", "ar"}:
        default_language = "en"

    content = {
        "en": _normalize_language_content(
            "en",
            state_playbook,
            payload_content.get("en", {}),
        ),
        "ar": _normalize_language_content(
            "ar",
            state_playbook,
            payload_content.get("ar", {}),
        ),
    }

    selected = content[default_language]
    selected_goal = selected["goals"][recommended_goal]

    return {
        "version": "interactive-v2",
        "state": str(state or state_key).capitalize(),
        "state_key": state_key,
        "recommended_goal": recommended_goal,
        "default_language": default_language,
        "available_languages": ["en", "ar"],
        "content": content,
        "source": "MindSense Performance Guide",
        # Backward compatible fields for older screens.
        "title": selected["title"],
        "summary": selected["summary"],
        "focus_label": selected_goal["label"],
        "items": selected_goal["plan"],
        "why": selected_goal["why"],
        "aftercare": selected_goal["after"],
    }


def get_coach_advice(
    cognitive_state: str,
    retrieved_text: str,
    preferred_goal: str | None = None,
    user_context: str | None = None,
    preferred_language: str | None = None,
) -> dict:
    goal_line = (
        f"The user selected this interaction goal: {preferred_goal}."
        if preferred_goal
        else "Choose the best recommended_goal for the user's state."
    )
    context_line = (
        f"Extra user context: {user_context}"
        if user_context
        else "No extra user context was provided."
    )
    language_line = (
        f"The user's preferred display language is: {preferred_language}."
        if preferred_language
        else "Return both English and Arabic content."
    )
    prompt = f"""
You are the MindSense AI Performance Coach.
The user's detected emotion is: {cognitive_state}
{goal_line}
{context_line}
{language_line}

Retrieved knowledge-base intervention context:
{retrieved_text}

Create a short, non-medical, interactive intervention.
Return valid JSON only. Do not wrap it in markdown.

Required JSON schema:
{{
  "recommended_goal": "calm | focus | reflect",
  "default_language": "en | ar",
  "content": {{
    "en": {{
      "title": "short title",
      "summary": "one sentence",
      "goals": {{
        "calm": {{"label": "Calm: outcome", "plan": ["3-5 steps"], "why": "why this goal helps", "after": "what to do after"}},
        "focus": {{"label": "Focus: outcome", "plan": ["3-5 steps"], "why": "why this goal helps", "after": "what to do after"}},
        "reflect": {{"label": "Reflect: outcome", "plan": ["3-5 steps"], "why": "why this goal helps", "after": "what to do after"}}
      }}
    }},
    "ar": {{
      "title": "عنوان عربي قصير",
      "summary": "جملة عربية واحدة",
      "goals": {{
        "calm": {{"label": "هدوء: النتيجة", "plan": ["3-5 خطوات بالعربية"], "why": "لماذا يساعد هذا الهدف", "after": "ماذا يفعل بعده"}},
        "focus": {{"label": "تركيز: النتيجة", "plan": ["3-5 خطوات بالعربية"], "why": "لماذا يساعد هذا الهدف", "after": "ماذا يفعل بعده"}},
        "reflect": {{"label": "تأمل: النتيجة", "plan": ["3-5 خطوات بالعربية"], "why": "لماذا يساعد هذا الهدف", "after": "ماذا يفعل بعده"}}
      }}
    }}
  }}
}}

Every goal must have its own plan, why, and after.
Arabic should be natural, supportive Arabic. Keep it practical and safe.
Do not diagnose the user.
"""

    result = llm.invoke(prompt)
    parsed = _extract_json(result.content)
    return _normalize_intervention_payload(
        cognitive_state,
        parsed,
        preferred_goal=preferred_goal,
        preferred_language=preferred_language,
    )


def get_intervention(
    mental_state: str,
    goal: str | None = None,
    user_context: str | None = None,
    language: str | None = None,
) -> dict:
    results = vector_db.similarity_search(f"Protocol: {mental_state}", k=1)

    if results:
        protocol_text = "\n\n---\n\n".join([res.page_content for res in results])
    else:
        protocol_text = (
            "Take a short three-minute reset, reduce stimulation, and return "
            "with one clear next action."
        )

    try:
        return get_coach_advice(
            mental_state,
            protocol_text,
            preferred_goal=goal,
            user_context=user_context,
            preferred_language=language,
        )
    except Exception:
        return _normalize_intervention_payload(
            mental_state,
            None,
            preferred_goal=goal,
            preferred_language=language,
        )
