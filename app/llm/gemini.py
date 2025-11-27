import os
import enum
from pydantic import BaseModel
from google import genai
from google.genai import types
from .base import LLMProvider
from app.config import settings

class Emotion(str, enum.Enum):
    NEUTRAL = "neutral"
    HAPPY = "happy"
    WINK = "wink"
    SLEEPY = "sleepy"
    WORRIED = "worried"
    SURPRISED = "surprised"
    SHOCKED = "shocked"
    ANGRY = "angry"
    NEUTRAL2 = "neutral2"
    CLOSED = "closed"
    SQUINT = "squint"
    SAD = "sad"
    CRY = "cry"
    FEAR = "fear"
    ANNOYED = "annoyed"
    GRUMPY = "grumpy"
    TALKING1 = "talking1"
    TALKING2 = "talking2"
    EXCITED = "excited"
    LOVE = "love"
    SPARKLE = "sparkle"
    DIZZY = "dizzy"
    SMIRK = "smirk"
    MEH = "meh"
    TALKING3 = "talking3"
    BORED = "bored"
    THINKING = "thinking"
    CONFUSED = "confused"
    TIRED = "tired"
    DEAD = "dead"
    SASSY = "sassy"
    RAGE = "rage"

class AIResponse(BaseModel):
    message: str
    emotion: Emotion

class GeminiLLM(LLMProvider):
    def __init__(self, model_name: str = 'gemini-2.5-flash'):
        self.api_key = settings.gemini_api_key
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables.")
        
        self.client = genai.Client(api_key=self.api_key)
        self.model_name = model_name

    def generate(self, prompt: str, system_instruction: str = None) -> dict | str:
        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json",
            response_schema=AIResponse
        )
            
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=config
            )
            
            # Parse the JSON response
            # The SDK might return a parsed object if response_schema is used, 
            # or we parse response.text.
            # With google-genai and response_schema, response.parsed is usually available.
            
            if response.parsed:
                return response.parsed.model_dump() # Return dict
            else:
                # Fallback if parsing fails but text exists
                import json
                return json.loads(response.text)
                
        except Exception as e:
            print(f"[Error] Gemini API failed: {e}")
            return {"message": "I couldn't generate a response.", "emotion": "worried"}

    def transcribe(self, audio_bytes: bytes) -> str:
        """Transcribes audio bytes to text using Gemini."""
        try:
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
