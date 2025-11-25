from abc import ABC, abstractmethod
from typing import Optional, Dict, Any

class AppProvider(ABC):
    @abstractmethod
    def get_active_app_name(self) -> Optional[str]:
        """Returns the name of the currently active application."""
        pass

    @abstractmethod
    def is_target_app(self, app_name: str) -> bool:
        """Checks if the given app name matches this provider's target."""
        pass

    @abstractmethod
    def get_context(self) -> Any:
        """Retrieves context from the application."""
        pass
