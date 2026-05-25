from typing import Dict, List

class MemoryEngine:
    def __init__(self):
        # In-memory session store: { session_id: [ {"role": "user", "content": "..."}, ... ] }
        self.active_sessions: Dict[str, List[Dict[str, str]]] = {}
        # Simple long-term preferences store: { user_id: { "style": "...", "goals": [] } }
        self.long_term_memory: Dict[str, dict] = {}

    def get_session_history(self, session_id: str) -> List[Dict[str, str]]:
        return self.active_sessions.get(session_id, [])

    def add_message(self, session_id: str, role: str, content: str):
        if session_id not in self.active_sessions:
            self.active_sessions[session_id] = []
        self.active_sessions[session_id].append({"role": role, "content": content})
        
        # Keep only the last 20 turns to avoid context overflow
        if len(self.active_sessions[session_id]) > 40: # 20 user + 20 assistant
            self.active_sessions[session_id] = self.active_sessions[session_id][-40:]

    def get_user_preferences(self, user_id: str) -> dict:
        return self.long_term_memory.get(user_id, {})

    def update_user_preferences(self, user_id: str, preferences: dict):
        if user_id not in self.long_term_memory:
            self.long_term_memory[user_id] = {}
        self.long_term_memory[user_id].update(preferences)

    def clear_memory(self, user_id: str):
        if user_id in self.long_term_memory:
            del self.long_term_memory[user_id]
            
    def clear_session(self, session_id: str):
        if session_id in self.active_sessions:
            del self.active_sessions[session_id]

# Singleton instance for the service
memory_engine = MemoryEngine()
