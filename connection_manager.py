from typing import Dict, Any
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.active_sessions: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, session_id: str) -> None:
        await websocket.accept()
        self.active_sessions[session_id] = websocket
    
    def disconnect(self, session_id: str) -> None:
        self.active_sessions.pop(session_id, None)

    async def send_json(self, session_id: str, data: Dict[str, Any]) -> None:
        ws = self.active_sessions.get(session_id)
        if ws:
            await ws.send_json(data)