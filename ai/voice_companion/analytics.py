class Analytics:
    @staticmethod
    def calculate_engagement(turn_count: int, duration_seconds: float) -> int:
        """
        Calculates a simple engagement score (0-100) based on session length and turns.
        """
        if duration_seconds == 0:
            return 0
            
        turns_score = min(50, turn_count * 5)
        duration_score = min(50, (duration_seconds / 60) * 5)
        
        return int(turns_score + duration_score)

analytics = Analytics()
