import asyncio
import json
import logging
import sys
from typing import List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from app.llm.gemini import GeminiLLM
from app.apps.monitor import SystemMonitor
from app.apps.registry import AppRegistry
from app.setup import setup_registry, setup_tts
from app.prompts.personas import PERSONA
from app.prompts.app_instructions import get_app_instruction
from app.config import settings

IGNORED_APPS = ["Electron"]
last_valid_app = "Unknown"

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

    async def disconnect_all(self):
        for connection in self.active_connections[:]:
            try:
                await connection.close()
            except Exception:
                pass
        self.active_connections.clear()

manager = ConnectionManager()
llm = GeminiLLM()
system_monitor = SystemMonitor()

registry = setup_registry()
tts = setup_tts()

monitor_task = None

async def monitor_loop():
    """Background task to monitor active app and emit events."""
    logger.info("Monitor loop started.")
    previous_app = None
    last_suggestion_time = 0
    suggestion_cooldown = settings.suggestion_cooldown
    
    global last_valid_app
    try:
        while True:
            try:
                current_app = system_monitor.get_active_app_name()
                # logger.debug(f"Current App: {current_app}") # Verbose
                
                if current_app in IGNORED_APPS:
                    # If we are in an ignored app (like the companion itself), 
                    # we don't update the state or trigger events.
                    await asyncio.sleep(settings.monitor_interval)
                    continue
                    
                last_valid_app = current_app
                
                if current_app != previous_app:
                    logger.info(f"App switch detected: {previous_app} -> {current_app}")
                    
                    provider = registry.get_provider(current_app)
                    if provider:
                        current_time = asyncio.get_event_loop().time()
                        if current_time - last_suggestion_time >= suggestion_cooldown:
                            logger.info(f"Target app {current_app} active. Cooldown satisfied.")
                            
                            context = provider.get_context()
                            logger.info(f"Retrieved context: {context}")
                            
                            await manager.broadcast({
                                "type": "thinking_start",
                                "data": {"context": f"User switched to {current_app}"}
                            })
                            
                            # Use the single defined PERSONA
                            app_instruction = get_app_instruction(current_app)
                            
                            system_prompt = f"{PERSONA['system_instruction']}\n\n{app_instruction}"
                            user_prompt = app_instruction.format(
                                app_name=current_app,
                                context=context
                            )
                            
                            logger.info("Generating suggestion with LLM...")
                            response_data = llm.generate(user_prompt, system_prompt)
                            logger.info(f"Generated suggestion: {response_data}")
                            
                            message_text = response_data
                            emotion = "neutral"
                            
                            if isinstance(response_data, dict):
                                message_text = response_data.get("message", "")
                                emotion = response_data.get("emotion", "neutral")
                            
                            await manager.broadcast({
                                "type": "suggestion",
                                "data": {
                                    "app_name": current_app,
                                    "message": message_text,
                                    "emotion": emotion
                                }
                            })
                            
                            # Speak the suggestion on the server
                            tts.speak(message_text)
                            
                            last_suggestion_time = current_time
                        else:
                            logger.info(f"Target app {current_app} active, but cooldown active ({int(suggestion_cooldown - (current_time - last_suggestion_time))}s left).")
                
                previous_app = current_app
                await asyncio.sleep(settings.monitor_interval)
            except asyncio.CancelledError:
                raise
            except Exception as e:
                logger.error(f"Monitor error: {e}")
                await asyncio.sleep(settings.monitor_interval)
    except asyncio.CancelledError:
        logger.info("Monitor loop cancelled.")

@app.on_event("startup")
async def startup_event():
    global monitor_task
    monitor_task = asyncio.create_task(monitor_loop())

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down server...")
    if monitor_task:
        monitor_task.cancel()
        try:
            await monitor_task
        except asyncio.CancelledError:
            pass
    
    await manager.disconnect_all()
    logger.info("Server shutdown complete.")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    # try:  <-- Removed outer try
    while True:
        try:
            # Receive message (can be text or bytes)
            message = await websocket.receive()
            
            user_message = ""
            
            if "text" in message:
                data = json.loads(message["text"])
                if data.get("type") == "message":
                    user_message = data["data"]["content"]
                    logger.info(f"Received user message: {user_message}")
            
            elif "bytes" in message:
                audio_bytes = message["bytes"]
                logger.info(f"Received audio bytes: {len(audio_bytes)} bytes")
                
                await manager.broadcast({
                    "type": "thinking_start",
                    "data": {"context": "Transcribing audio..."}
                })
                
                user_message = llm.transcribe(audio_bytes)
                logger.info(f"Transcribed text: {user_message}")
                
                if not user_message:
                    continue

            if user_message:
                # Get current context from the active app
                current_app = system_monitor.get_active_app_name()
                
                if current_app in IGNORED_APPS:
                    logger.info(f"Ignored app {current_app} active. Using last valid app: {last_valid_app}")
                    current_app = last_valid_app
                
                provider = registry.get_provider(current_app)
                if provider:
                    context = provider.get_context()
                else:
                    window_title = system_monitor.get_active_window_title(current_app)
                    context = f"Active Application: {current_app}, Window Title: {window_title}"
                
                logger.info(f"Retrieved context for user question: {context}")
                
                await manager.broadcast({
                    "type": "thinking_start",
                    "data": {"context": "Processing user question..."}
                })
                
                # We want to use the 'numbers_guru' persona if we have valid context, 
                # or at least pass the context to the default persona.
                # Let's check if we have a valid document open.
                # Use the active app for instructions
                app_instruction = get_app_instruction(current_app)
                
                system_prompt = f"{PERSONA['system_instruction']}\n\n{app_instruction}"
                
                base_prompt = app_instruction.format(
                   app_name=current_app,
                   context=context
                )
                user_prompt = f"{base_prompt}\n\nUser Question: {user_message}"
                
                logger.info("Generating reply with LLM...")
                response_data = llm.generate(user_prompt, system_prompt)
                logger.info(f"Generated reply: {response_data}")
                
                message_text = response_data
                emotion = "neutral"
                
                if isinstance(response_data, dict):
                    message_text = response_data.get("message", "")
                    emotion = response_data.get("emotion", "neutral")
                
                await manager.broadcast({
                    "type": "reply",
                    "data": {
                        "message": message_text,
                        "emotion": emotion
                    }
                })
                
                # Speak the reply on the server
                tts.speak(message_text)
            
        except WebSocketDisconnect:
            manager.disconnect(websocket)
            break
        except Exception as e:
            logger.error(f"WebSocket error: {e}")
            continue
