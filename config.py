import os
from dotenv import load_dotenv

load_dotenv()

config = {
    "gemini_api_key": os.getenv("GEMINI_API_KEY"),
    "gemini_default_model": "gemini-2.5-flash-lite-preview-09-2025",
    "gemini_live_model": "gemini-2.5-flash-native-audio-preview-09-2025",
    "ollama_base_url": "http://localhost:11434",
    "ollama_default_model": "llama3.1",
}
