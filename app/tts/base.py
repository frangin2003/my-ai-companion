from abc import ABC, abstractmethod

class TTSProvider(ABC):
    @abstractmethod
    def speak(self, text: str):
        """Converts text to speech."""
        pass
