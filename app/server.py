import asyncio
import json
import logging
from typing import List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from app.llm.gemini import GeminiLLM
from app.apps.numbers import NumbersApp
from app.prompts.personas import get_persona

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger("Server")

app = FastAPI()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"Client connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        logger.info(f"Client disconnected. Total: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        logger.info(f"Broadcasting event: {message['type']}")
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()
llm = GeminiLLM()
app_monitor = NumbersApp()

async def monitor_loop():
    """Background task to monitor active app and emit events."""
    logger.info("Monitor loop started.")
    previous_app = None
    last_suggestion_time = 0
    suggestion_cooldown = 60
    
    while True:
        try:
            current_app = app_monitor.get_active_app_name()
            # logger.debug(f"Current App: {current_app}") # Verbose
            
            if current_app != previous_app:
                logger.info(f"App switch detected: {previous_app} -> {current_app}")
                
                if app_monitor.is_target_app(current_app):
                    current_time = asyncio.get_event_loop().time()
                    if current_time - last_suggestion_time >= suggestion_cooldown:
                        logger.info(f"Target app {current_app} active. Cooldown satisfied.")
                        
                        context = app_monitor.get_context()
                        logger.info(f"Retrieved context: {context}")
                        
                        await manager.broadcast({
                            "type": "thinking_start",
                            "data": {"context": f"User switched to {current_app}"}
                        })
                        
                        persona = get_persona("numbers_guru")
                        prompt = persona["prompt_template"].format(
                            app_name=current_app,
                            context=context
                        )
                        
                        logger.info("Generating suggestion with LLM...")
                        suggestion = llm.generate(prompt, persona["system_instruction"])
                        logger.info(f"Generated suggestion: {suggestion}")
                        
                        await manager.broadcast({
                            "type": "suggestion",
                            "data": {
                                "app_name": current_app,
                                "message": suggestion
                            }
                        })
                        
                        last_suggestion_time = current_time
                    else:
                        logger.info(f"Target app {current_app} active, but cooldown active ({int(suggestion_cooldown - (current_time - last_suggestion_time))}s left).")
            
            previous_app = current_app
            await asyncio.sleep(10)
        except Exception as e:
            logger.error(f"Monitor error: {e}")
            await asyncio.sleep(10)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(monitor_loop())

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            if data.get("type") == "message":
                user_message = data["data"]["content"]
                logger.info(f"Received user message: {user_message}")
                
                # Get current context
                current_app = app_monitor.get_active_app_name()
                context = "No specific app context."
                if app_monitor.is_target_app(current_app):
                    context = app_monitor.get_context()
                
                await manager.broadcast({
                    "type": "thinking_start",
                    "data": {"context": "Processing user question..."}
                })
                
                persona = get_persona("default")
                prompt = persona["prompt_template"].format(
                    context=context,
                    user_input=user_message
                )
                
                logger.info("Generating reply with LLM...")
                response = llm.generate(prompt, persona["system_instruction"])
                logger.info(f"Generated reply: {response}")
                
                await manager.broadcast({
                    "type": "reply",
                    "data": {"message": response}
                })
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)
