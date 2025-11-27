import sys
from app.apps.registry import AppRegistry
from app.apps.base import AppProvider
from app.tts.base import TTSProvider
from app.tts.gemini import GeminiTTS

# Conditional imports based on OS
if sys.platform == "win32":
    from app.apps.excel import ExcelApp
    from app.tts.windows import WindowsTTS
    DefaultApp = ExcelApp
    DefaultTTS = WindowsTTS
elif sys.platform == "darwin":
    from app.apps.numbers import NumbersApp
    from app.tts.macos import MacOSTTS
    DefaultApp = NumbersApp
    DefaultTTS = MacOSTTS
else:
    # Fallback or error for unsupported OS
    class MockApp(AppProvider):
        def get_active_app_name(self): return None
        def is_target_app(self, name): return False
        def get_context(self): return "Unsupported OS"
    
    class MockTTS(TTSProvider):
        def speak(self, text): pass
        
    DefaultApp = MockApp
    DefaultTTS = MockTTS

def setup_registry() -> AppRegistry:
    """Initializes the AppRegistry with default apps for the current OS."""
    registry = AppRegistry()
    registry.register(DefaultApp())
    return registry

def setup_tts() -> TTSProvider:
    """Initializes the TTS provider for the current OS."""
    # Uncomment the following line to use Gemini TTS
    # return GeminiTTS()
    return DefaultTTS()
