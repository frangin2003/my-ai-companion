import asyncio
import json
import threading
import sys
from websockets.sync.client import connect
from app.tts.macos import MacOSTTS

def listen_for_messages(websocket, tts):
    """Listens for messages from the server."""
    try:
        for message in websocket:
            data = json.loads(message)
            event_type = data.get("type")
            payload = data.get("data", {})
            
            if event_type == "thinking_start":
                print(f"\n[AI] Thinking... ({payload.get('context', '')})")
            elif event_type == "suggestion":
                msg = payload.get("message")
                print(f"\n[Suggestion] {msg}")
                tts.speak(msg)
                print("\nYou: ", end="", flush=True)
            elif event_type == "reply":
                msg = payload.get("message")
                print(f"\n[AI] {msg}")
                tts.speak(msg)
                print("\nYou: ", end="", flush=True)
            else:
                print(f"\n[Unknown Event] {data}")
    except Exception as e:
        print(f"\n[Client] Disconnected: {e}")
        sys.exit(0)

def main():
    print("=== AI Companion Client ===")
    uri = "ws://localhost:8000/ws"
    tts = MacOSTTS()
    
    try:
        with connect(uri) as websocket:
            print(f"[Client] Connected to {uri}")
            
            # Start listener thread
            listener_thread = threading.Thread(
                target=listen_for_messages, 
                args=(websocket, tts),
                daemon=True
            )
            listener_thread.start()
            
            print("Type your message and press Enter. Type 'quit' to exit.")
            print("\nYou: ", end="", flush=True)
            
            while True:
                user_input = sys.stdin.readline().strip()
                if user_input.lower() in ('quit', 'exit'):
                    break
                
                if user_input:
                    message = {
                        "type": "message",
                        "data": {"content": user_input}
                    }
                    websocket.send(json.dumps(message))
                    print("You: ", end="", flush=True)
                    
    except Exception as e:
        print(f"[Fatal Error] Could not connect to server: {e}")
        print("Ensure the server is running: 'uv run main.py'")

if __name__ == "__main__":
    main()
