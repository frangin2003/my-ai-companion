import asyncio
import json
import sys
import threading
import websockets
import pyaudio

# Configuration
WS_URL = "ws://localhost:8000/ws"
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 24000  # Gemini Live often uses 24kHz or 16kHz
CHUNK = 1024

class GeminiClient:
    def __init__(self):
        self.recording = False
        self.audio_queue = asyncio.Queue()
        self.p = pyaudio.PyAudio()
        self.input_stream = None
        self.stop_event = threading.Event()

    async def connect(self):
        try:
            async with websockets.connect(WS_URL) as websocket:
                print("Connected to WebSocket server.")
                
                # Start listening for user input in a separate task
                input_task = asyncio.create_task(self.handle_user_input(websocket))
                # Start listening for server messages in a separate task
                receive_task = asyncio.create_task(self.handle_server_messages(websocket))

                await asyncio.gather(input_task, receive_task)
        except Exception as e:
            print(f"Connection error: {e}")
        finally:
            self.cleanup_audio()

    async def handle_server_messages(self, websocket):
        try:
            async for message in websocket:
                data = json.loads(message)
                msg_type = data.get("type")

                if msg_type == "session_started":
                    print(f"[Server] Session started: {data.get('session_id')}")
                elif msg_type == "pong":
                    print("[Server] Pong!")
                elif msg_type == "status":
                    print(f"[Server Status] {data.get('status')}")
                elif msg_type == "response":
                    print(f"\n[Gemini]: {data.get('text')}\n")
                    print("> ", end="", flush=True)
                elif msg_type == "error":
                    print(f"[Error] {data.get('message')}")
        except websockets.exceptions.ConnectionClosed:
            print("Server connection closed.")

    async def handle_user_input(self, websocket):
        print("Commands:")
        print("  /text <message>  - Send text message")
        print("  /start           - Start recording audio (Push-to-Talk)")
        print("  /end             - Stop recording and send audio")
        print("  /ping            - Ping server")
        print("  /quit            - Exit")
        print("> ", end="", flush=True)

        loop = asyncio.get_running_loop()

        while True:
            # Run blocking input in a thread to not block the event loop
            user_input = await loop.run_in_executor(None, sys.stdin.readline)
            user_input = user_input.strip()

            if not user_input:
                continue

            if user_input == "/quit":
                print("Exiting...")
                sys.exit(0)
            
            elif user_input == "/ping":
                await websocket.send(json.dumps({"type": "ping"}))
            
            elif user_input.startswith("/text "):
                text = user_input[6:].strip()
                await websocket.send(json.dumps({
                    "type": "user_message",
                    "text": text,
                    "backend": "gemini" # Default to gemini text
                }))

            elif user_input == "/start":
                if not self.recording:
                    self.start_recording(websocket)
                else:
                    print("Already recording.")

            elif user_input == "/end":
                if self.recording:
                    await self.stop_recording_and_send(websocket)
                else:
                    print("Not recording.")
            
            else:
                print("Unknown command.")
            
            print("> ", end="", flush=True)

    def start_recording(self, websocket):
        print("Recording... (Type /end to stop)")
        self.recording = True
        self.stop_event.clear()
        
        self.input_stream = self.p.open(
            format=FORMAT,
            channels=CHANNELS,
            rate=RATE,
            input=True,
            frames_per_buffer=CHUNK
        )

        # Audio capture runs in a separate thread to avoid blocking asyncio loop
        # However, since we want to send one big blob at the end (simpler for now),
        # we can just collect frames. 
        # For a real-time stream, we'd send chunks over websocket continuously.
        # Given the "Push-to-talk" requirement sending a byte array, we'll accumulate.
        
        self.frames = []
        self.record_thread = threading.Thread(target=self._record_loop)
        self.record_thread.start()

    def _record_loop(self):
        while self.recording and not self.stop_event.is_set():
            try:
                data = self.input_stream.read(CHUNK)
                self.frames.append(data)
            except Exception as e:
                print(f"Error recording: {e}")
                break

    async def stop_recording_and_send(self, websocket):
        print("Stopping recording and sending...")
        self.recording = False
        self.stop_event.set()
        self.record_thread.join()
        
        if self.input_stream:
            self.input_stream.stop_stream()
            self.input_stream.close()
            self.input_stream = None

        audio_data = b"".join(self.frames)
        
        # Send as binary message
        await websocket.send(audio_data)
        print(f"Sent {len(audio_data)} bytes of audio.")
        self.frames = []

    def cleanup_audio(self):
        if self.input_stream:
            self.input_stream.stop_stream()
            self.input_stream.close()
        self.p.terminate()

if __name__ == "__main__":
    client = GeminiClient()
    try:
        asyncio.run(client.connect())
    except KeyboardInterrupt:
        pass

