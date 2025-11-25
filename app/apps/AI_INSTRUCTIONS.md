# App Module Instructions

This module handles integration with specific applications to retrieve context.

## How to Extend
To add support for a new application (e.g., Excel, VS Code):
1.  Create a new file (e.g., `excel.py`).
2.  Inherit from `AppProvider` in `base.py`.
3.  Implement `get_active_app_name`, `is_target_app`, and `get_context`.

## Prompt for AI Assistant
"I want to add support for [App Name] to this module. Please create a class that inherits from `AppProvider`. It should use AppleScript (or another method) to detect if [App Name] is active and retrieve relevant context (e.g., open document, selected text)."
