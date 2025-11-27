import asyncio
import sys
import json
import sounddevice as sd
import numpy as np
import scipy.io.wavfile as wav
import io
from websockets.client import connect

# Configuration
URI = "ws://localhost:8000/ws"
SAMPLE_RATE = 44100  # Hz
CHANNELS = 1

async def listen_for_messages(websocket):
    """Listens for incoming messages from the server."""
    try:
        async for message in websocket:
            data = json.loads(message)
            msg_type = data.get("type")
            payload = data.get("data", {})
            
            if msg_type == "thinking_start":
                print(f"\n[AI] Thinking... ({payload.get('context', '')})")
            elif msg_type == "suggestion":
                print(f"\n[AI Suggestion] {payload.get('message')}")
            elif msg_type == "reply":
                print(f"\n[AI] {payload.get('message')}")
            elif msg_type == "error":
                print(f"\n[Error] {payload.get('message')}")
    except Exception as e:
        print(f"\n[Client] Disconnected: {e}")
        sys.exit(0)

async def record_audio(duration=5):
    """Records audio for a fixed duration."""
    print(f"\n[Client] Recording for {duration} seconds...")
    recording = sd.rec(int(duration * SAMPLE_RATE), samplerate=SAMPLE_RATE, channels=CHANNELS, dtype='int16')
    sd.wait()  # Wait until recording is finished
    print("[Client] Recording finished.")
    
    # Convert to WAV bytes
    wav_io = io.BytesIO()
    wav.write(wav_io, SAMPLE_RATE, recording)
    return wav_io.getvalue()

async def main():
    print("=== AI Companion Client ===")
    print("Commands:")
    print("  /record [seconds] - Record audio and send (default 5s)")
    print("  /quit             - Exit")
    print("  [message]         - Send text message")
    
    try:
        async with connect(URI) as websocket:
            print(f"[Client] Connected to {URI}")
            
            # Start listening task
            listen_task = asyncio.create_task(listen_for_messages(websocket))
            
            loop = asyncio.get_running_loop()
            
            while True:
                # Use a separate thread for input to not block the event loop
                user_input = await loop.run_in_executor(None, input, "")
                
                if user_input.strip().lower() == "/quit":
                    break
                
                elif user_input.strip().lower().startswith("/record"):
                    parts = user_input.strip().split()
                    duration = 5
                    if len(parts) > 1 and parts[1].isdigit():
                        duration = int(parts[1])
                    
                    audio_bytes = await record_audio(duration)
                    await websocket.send(audio_bytes)
                    print("[Client] Audio sent.")
                    
                elif user_input.strip():
                    message = {
                        "type": "message",
                        "data": {
                            "content": user_input
                        }
                    }
                    await websocket.send(json.dumps(message))
            
            listen_task.cancel()
            
    except Exception as e:
        print(f"[Client] Connection error: {e}")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n[Client] Exiting...")
