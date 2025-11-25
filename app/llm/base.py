from abc import ABC, abstractmethod

class LLMProvider(ABC):
    @abstractmethod
    def generate(self, prompt: str, system_instruction: str = None) -> str:
        """Generates text based on the prompt and optional system instruction."""
        pass
