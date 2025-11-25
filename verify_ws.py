import asyncio
import json
import sys
from websockets.sync.client import connect

def test_connection():
    uri = "ws://localhost:8000/ws"
    try:
        with connect(uri) as websocket:
            print("[Test] Connected to server.")
            
            # Send a test message
            msg = {"type": "message", "data": {"content": "Hello AI"}}
            websocket.send(json.dumps(msg))
            print("[Test] Sent message.")
            
            # Expect "thinking_start"
            response1 = websocket.recv()
            print(f"[Test] Received: {response1}")
            
            # Expect "reply"
            response2 = websocket.recv()
            print(f"[Test] Received: {response2}")
            
    except Exception as e:
        print(f"[Test] Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    test_connection()
