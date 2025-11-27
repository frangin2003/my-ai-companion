# App Module Instructions

This module handles integration with specific applications to retrieve context.

## How to Extend
To add support for a new application (e.g., VS Code, Spotify):
1.  Create a new file (e.g., `vscode.py`).
2.  Inherit from `AppProvider` in `base.py`.
3.  Implement `get_active_app_name`, `is_target_app`, and `get_context`.
4.  **Register the Provider**: In `app/server.py`, import your class and add `registry.register(VSCodeApp())`.

## Prompt for AI Assistant
"I want to add support for [App Name] to this module. Please create a class that inherits from `AppProvider` to detect [App Name] and retrieve context. Also, show me how to register it in `server.py`."
