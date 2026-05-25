class UsageLimiter:
    @staticmethod
    def calculate_turn_minutes(audio_bytes_len: int, response_bytes_len: int) -> float:
        """
        Estimates minutes consumed based on audio byte length.
        Assumes 16kHz mono audio (approx 32KB/sec).
        """
        # Roughly 32,000 bytes = 1 second
        bytes_per_sec = 32000
        seconds = (audio_bytes_len + response_bytes_len) / bytes_per_sec
        return round(seconds / 60, 4)

usage_limiter = UsageLimiter()
