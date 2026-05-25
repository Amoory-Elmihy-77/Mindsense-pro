import re

CRISIS_KEYWORDS = [
    r"انتحار", r"هموت نفسي", r"انهي حياتي", r"مش عايز اعيش",
    r"suicide", r"kill myself", r"end my life", r"don't want to live",
    r"أئذي نفسي", r"hurt myself", r"harm myself",
    r"مخنوق لدرجة الموت", r"يأس تام"
]

class CrisisDetector:
    @staticmethod
    def analyze_text(text: str) -> str:
        """
        Analyzes text for crisis keywords.
        Returns severity: 'none', 'low', 'medium', 'high', 'critical'
        """
        text_lower = text.lower()
        
        for pattern in CRISIS_KEYWORDS:
            if re.search(pattern, text_lower):
                return "critical"
                
        # Future: Implement ML-based or LLM-based softer detection for 'medium'
        return "none"

    @staticmethod
    def get_crisis_response(language: str = "arabic") -> str:
        """
        Standard immediate response when crisis is detected.
        """
        if language == "english":
            return (
                "I hear you and I feel your pain, but please remember you are not alone. "
                "I am just an AI and cannot help you the way you deserve right now. "
                "Please reach out immediately to someone you trust or a mental health support hotline. Your life matters."
            )
        return (
            "أنا سامعك وحاسس بوجعك، بس أرجوك تفتكر إنك مش لوحدك. "
            "أنا مجرد ذكاء اصطناعي ومش هقدر أساعدك بالشكل اللي تستحقه دلوقتي. "
            "أرجوك تواصل فوراً مع حد تثق فيه أو كلم خط الدعم النفسي. حياتك تهمنا."
        )

crisis_detector = CrisisDetector()
