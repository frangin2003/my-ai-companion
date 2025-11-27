from typing import List, Optional
from .base import AppProvider

class AppRegistry:
    def __init__(self):
        self.providers: List[AppProvider] = []

    def register(self, provider: AppProvider):
        """Registers a new app provider."""
        self.providers.append(provider)

    def get_provider(self, app_name: str) -> Optional[AppProvider]:
        """Returns the first provider that handles the given app name."""
        if not app_name:
            return None
            
        for provider in self.providers:
            if provider.is_target_app(app_name):
                return provider
        return None
