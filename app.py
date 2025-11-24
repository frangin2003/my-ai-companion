import json
from uuid import uuid4
from typing import Dict, Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from connection_manager import ConnectionManager
from config import config
from llm_utils import chat_simple

app = FastAPI()

# Allow your frontend origin(s)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    # Wait for the first message to create session_id
    session_id = str(uuid4())

    try:
        await manager.connect(websocket, session_id)

        # Let the client know the session_id
        await manager.send_json(session_id, {
            "type": "session_started",
            "session_id": session_id,
        })

        while True:
            message = await websocket.receive()
            
            if "text" in message:
                try:
                    data = json.loads(message["text"])
                except json.JSONDecodeError:
                    continue
                
                msg_type = data.get("type")
                
                if msg_type == "ping":
                    await manager.send_json(session_id, {
                        "type": "pong",
                        "session_id": session_id,
                    })
                    continue

                if msg_type == "user_message":
                    text = data.get("text", "").strip()
                    if not text:
                        continue
                    
                    backend = data.get("backend", "gemini")
                    
                    # send a 'thinking' status to client
                    await manager.send_json(session_id, {
                        "type": "status",
                        "status": "thinking",
                        "session_id": session_id,
                        "message_id": str(uuid4())
                    })

                    try:
                        response = await chat_simple(
                            backend=backend,
                            config=config,
                            user_text=text,
                            system_prompt="You are a helpful assistant."
                        )
                        await manager.send_json(session_id, {
                            "type": "response", 
                            "text": response,
                            "session_id": session_id
                        })
                    except Exception as e:
                         await manager.send_json(session_id, {
                            "type": "error", 
                            "message": str(e),
                            "session_id": session_id
                        })
            
            elif "bytes" in message:
                # Handle Audio
                audio_data = message["bytes"]
                
                await manager.send_json(session_id, {
                    "type": "status", 
                    "status": "processing_audio",
                    "session_id": session_id
                })

                try:
                    # Use gemini-live for audio
                    response = await chat_simple(
                        backend="gemini-live",
                        config=config,
                        user_text="Please respond to this audio.",
                        audio_data=audio_data,
                        system_prompt="You are a helpful audio assistant."
                    )
                    await manager.send_json(session_id, {
                        "type": "response", 
                        "text": response,
                        "session_id": session_id
                    })
                except Exception as e:
                     await manager.send_json(session_id, {
                        "type": "error", 
                        "message": str(e),
                        "session_id": session_id
                    })

    except WebSocketDisconnect:
        manager.disconnect(session_id)
    except Exception as e:
        print(f"Error: {e}")
        manager.disconnect(session_id)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)