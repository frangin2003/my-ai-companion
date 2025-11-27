import os
import sys
import subprocess
import tempfile
import wave
from google import genai
from google.genai import types
from app.config import settings
from .base import TTSProvider

class GeminiTTS(TTSProvider):
    def __init__(self):
        if not settings.gemini_api_key:
            print("[GeminiTTS] Error: GEMINI_API_KEY not set.")
            self.client = None
            return

        self.client = genai.Client(api_key=settings.gemini_api_key)
        self.model_name = "gemini-2.5-flash-preview-tts"

    def speak(self, text: str):
        if not self.client:
            return

        try:
            generate_config = types.GenerateContentConfig(
                response_modalities=["AUDIO"],
                speech_config=types.SpeechConfig(
                    voice_config=types.VoiceConfig(
                        prebuilt_voice_config=types.PrebuiltVoiceConfig(
                            voice_name="Puck"
                        )
                    )
                )
            )

            # 2. Generate Content
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=text,
                config=generate_config
            )

            # 3. Extract Raw Audio Bytes
            raw_audio_bytes = None
            if response.candidates and response.candidates[0].content.parts:
                for part in response.candidates[0].content.parts:
                    if part.inline_data:
                        raw_audio_bytes = part.inline_data.data
                        break
            
            if raw_audio_bytes:
                with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as fp:
                    temp_path = fp.name
                    
                with wave.open(temp_path, "wb") as wav_file:
                    wav_file.setnchannels(1)       # Mono
                    wav_file.setsampwidth(2)       # 16-bit (2 bytes)
                    wav_file.setframerate(24000)   # 24kHz Sample Rate
                    wav_file.writeframes(raw_audio_bytes)

                self._play_audio(temp_path)
            else:
                print(f"[GeminiTTS] Error: No audio data returned. Response: {response}")

        except Exception as e:
            print(f"[GeminiTTS] API Error: {e}")

    def _play_audio(self, file_path: str):
        try:
            print(f"[GeminiTTS] Playing audio: {file_path}")
            if sys.platform == "darwin":  # macOS
                subprocess.run(['afplay', file_path], check=True)
            elif sys.platform == "win32":  # Windows
                cmd = f'(New-Object Media.SoundPlayer "{file_path}").PlaySync();'
                subprocess.run(["powershell", "-c", cmd], check=True)
            else:  # Linux
                subprocess.run(['aplay', file_path], check=True)
        except Exception as e:
            print(f"[GeminiTTS] Playback Error: {e}")
        finally:
            if os.path.exists(file_path):
                os.remove(file_path)