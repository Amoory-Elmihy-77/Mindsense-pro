from .crisis_detector import crisis_detector

class SafetyLayer:
    @staticmethod
    def check_input(text: str) -> dict:
        """
        Moderates user input.
        """
        severity = crisis_detector.analyze_text(text)
        return {
            "is_safe": severity not in ["high", "critical"],
            "severity": severity,
            "reason": "Crisis keyword detected" if severity in ["high", "critical"] else None
        }

    @staticmethod
    def filter_output(response_text: str, language: str = "arabic") -> str:
        """
        Moderates AI output. Removes medical claims.
        """
        # Basic rule-based filtering
        forbidden_phrases = ["أنا دكتور", "تشخيصك هو", "علاجك هو", "خد الدواء ده", "I am a doctor", "your diagnosis"]
        
        for phrase in forbidden_phrases:
            if phrase.lower() in response_text.lower():
                if language == "english":
                    return "I cannot provide medical advice or diagnoses, but I'm here to listen. Would you like to talk more?"
                return "أنا مقدرش أقدم نصيحة طبية أو تشخيص، لكن أنا هنا عشان أسمعك. تحب تفضفض أكتر؟"
                
        return response_text

safety_layer = SafetyLayer()
