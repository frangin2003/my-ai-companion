import os
from google import genai
from google.genai import types
from .base import LLMProvider
from app.config import settings

class GeminiLLM(LLMProvider):
    def __init__(self, model_name: str = 'gemini-2.5-flash'):
        self.api_key = settings.gemini_api_key
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables.")
        
        self.client = genai.Client(api_key=self.api_key)
        self.model_name = model_name

    def generate(self, prompt: str, system_instruction: str = None) -> str:
        config = types.GenerateContentConfig(
            system_instruction=system_instruction
        )
            
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=config
            )
            return response.text.strip()
        except Exception as e:
            print(f"[Error] Gemini API failed: {e}")
            return "I couldn't generate a response."

    def transcribe(self, audio_bytes: bytes) -> str:
        """Transcribes audio bytes to text using Gemini."""
        try:
            # Create a Part object for the audio
            # google-genai SDK uses Pydantic models
            part = types.Part(
                inline_data=types.Blob(
                    data=audio_bytes,
                    mime_type="audio/wav"
                )
            )
            
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=[
                    "Please transcribe this audio accurately. Return ONLY the transcription.",
                    part
                ]
            )
            return response.text.strip()
        except Exception as e:
            print(f"[Error] Gemini Transcription failed: {e}")
            return ""
