import os
from .base import TTSProvider

class MacOSTTS(TTSProvider):
    def __init__(self, rate: int = 180):
        self.rate = rate

    def speak(self, text: str):
        # Escape double quotes to prevent shell injection/errors
        safe_text = text.replace('"', '\\"')
        os.system(f'say -r {self.rate} "{safe_text}"')
