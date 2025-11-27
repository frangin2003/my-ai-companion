import asyncio
import json
import sys
from websockets.client import connect
from prompt_toolkit import PromptSession
from prompt_toolkit.patch_stdout import patch_stdout
# Conditional imports for TTS
if sys.platform == "win32":
    from app.tts.windows import WindowsTTS as TTSProvider
elif sys.platform == "darwin":
    from app.tts.macos import MacOSTTS as TTSProvider
else:
    class TTSProvider:
        def speak(self, text): print(f"[TTS]: {text}")

async def listen_for_messages(websocket, tts):
    """Listens for messages from the server."""
    try:
        async for message in websocket:
            data = json.loads(message)
            event_type = data.get("type")
            payload = data.get("data", {})
            
            with patch_stdout():
                if event_type == "thinking_start":
                    print(f"\n[AI] Thinking... ({payload.get('context', '')})")
                elif event_type == "suggestion":
                    msg = payload.get("message")
                    print(f"\n[Suggestion] {msg}")
                    # Note: TTS behavior depends on OS implementation.
                    # In a real async app, we'd run this in an executor.
                    # For now, it might pause the UI briefly.
                    tts.speak(msg)
                elif event_type == "reply":
                    msg = payload.get("message")
                    print(f"\n[AI] {msg}")
                    tts.speak(msg)
                else:
                    print(f"\n[Unknown Event] {data}")
    except Exception as e:
        with patch_stdout():
            print(f"\n[Client] Disconnected: {e}")
        sys.exit(0)

async def main():
    print("=== AI Companion Client ===")
    uri = "ws://localhost:8000/ws"
    tts = TTSProvider()
    session = PromptSession()
    
    try:
        async with connect(uri) as websocket:
            with patch_stdout():
                print(f"[Client] Connected to {uri}")
                print("Type your message and press Enter. Type 'quit' to exit.")

            # Start listener task
            listener_task = asyncio.create_task(listen_for_messages(websocket, tts))
            
            while True:
                try:
                    user_input = await session.prompt_async("You: ")
                    
                    if user_input.lower() in ('quit', 'exit'):
                        break
                    
                    if user_input.strip():
                        message = {
                            "type": "message",
                            "data": {"content": user_input}
                        }
                        await websocket.send(json.dumps(message))
                        
                except (KeyboardInterrupt, EOFError):
                    break
            
            listener_task.cancel()
            
    except Exception as e:
        print(f"[Fatal Error] Could not connect to server: {e}")
        print("Ensure the server is running: 'uv run main.py'")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
