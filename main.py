import uvicorn
import os
from dotenv import load_dotenv

load_dotenv()

def main():
    print("=== AI Companion Server ===")
    print("Starting WebSocket server on ws://localhost:8000/ws")
    print("Run 'uv run client.py' in another terminal to connect.")
    
    # Run the FastAPI app defined in app/server.py
    uvicorn.run("app.server:app", host="0.0.0.0", port=8000, reload=True)

if __name__ == "__main__":
    main()
