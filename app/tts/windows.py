import win32com.client
from .base import TTSProvider

class WindowsTTS(TTSProvider):
    def __init__(self, rate: int = 1):
        try:
            self.speaker = win32com.client.Dispatch("SAPI.SpVoice")
            # SAPI rate is -10 to 10.
            # Map 180 (Mac default) to roughly 1 or 2.
            # If rate is > 10, assume it's WPM and clamp/map it?
            # Let's just stick to a safe default.
            self.speaker.Rate = 1 
        except Exception as e:
            print(f"TTS Init Error: {e}")
            self.speaker = None

    def speak(self, text: str):
        if self.speaker:
            try:
                # 1 = SVSFlagsAsync (don't block)
                self.speaker.Speak(text, 1)
            except Exception as e:
                print(f"TTS Speak Error: {e}")
        else:
            print(f"[TTS (Simulated)]: {text}")
