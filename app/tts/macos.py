import os
import subprocess
from .base import TTSProvider

class MacOSTTS(TTSProvider):
    def __init__(self, rate: int = 180):
        self.rate = rate

    def speak(self, text: str):
        # Escape double quotes to prevent shell injection/errors
        safe_text = text.replace('"', '\\"')
        # Use Popen for non-blocking execution
        subprocess.Popen(['say', '-r', str(self.rate), safe_text])
