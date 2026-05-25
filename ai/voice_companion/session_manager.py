import time
from typing import Dict
from pydantic import BaseModel

class SessionState:
    IDLE = "idle"
    STARTING = "starting"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    EXPIRED = "expired"

class SessionDTO(BaseModel):
    session_id: str
    user_id: str
    state: str
    started_at: float
    last_active: float
    turn_count: int

class SessionManager:
    def __init__(self):
        self.sessions: Dict[str, SessionDTO] = {}
        self.TIMEOUT_SECONDS = 90  # Session expires after 90s of inactivity

    def create_session(self, session_id: str, user_id: str) -> SessionDTO:
        session = SessionDTO(
            session_id=session_id,
            user_id=user_id,
            state=SessionState.STARTING,
            started_at=time.time(),
            last_active=time.time(),
            turn_count=0
        )
        self.sessions[session_id] = session
        return session

    def get_session(self, session_id: str) -> SessionDTO:
        session = self.sessions.get(session_id)
        if session and session.state == SessionState.ACTIVE:
            if time.time() - session.last_active > self.TIMEOUT_SECONDS:
                session.state = SessionState.EXPIRED
        return session

    def update_activity(self, session_id: str):
        session = self.sessions.get(session_id)
        if session:
            session.last_active = time.time()
            session.turn_count += 1
            if session.state in [SessionState.STARTING, SessionState.PAUSED]:
                session.state = SessionState.ACTIVE

    def pause_session(self, session_id: str):
        session = self.sessions.get(session_id)
        if session:
            session.state = SessionState.PAUSED

    def complete_session(self, session_id: str):
        session = self.sessions.get(session_id)
        if session:
            session.state = SessionState.COMPLETED

session_manager = SessionManager()
