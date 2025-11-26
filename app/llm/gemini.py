import os
import google.generativeai as genai
from .base import LLMProvider
from app.config import settings

class GeminiLLM(LLMProvider):
    def __init__(self, model_name: str = 'gemini-2.5-flash'):
        self.api_key = settings.gemini_api_key
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables.")
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel(model_name)

    def generate(self, prompt: str, system_instruction: str = None) -> str:
        # Note: gemini-2.5-flash supports system instructions via the model constructor,
        # but for simplicity in this workshop, we'll prepend it to the prompt if provided,
        # or we could re-instantiate the model. 
        # For this implementation, let's just prepend it to the prompt for flexibility.
        
        full_prompt = prompt
        if system_instruction:
            full_prompt = f"System Instruction: {system_instruction}\n\nUser Prompt: {prompt}"
            
        try:
            response = self.model.generate_content(full_prompt)
            return response.text.strip()
        except Exception as e:
            print(f"[Error] Gemini API failed: {e}")
            return "I couldn't generate a response."
