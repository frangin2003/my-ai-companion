# Prompts Module Instructions

This module manages personas and prompt templates.

## How to Extend
To customize the AI's personality:
1.  Open `personas.py`.
2.  Edit the `PERSONA` dictionary (system instruction).

To add instructions for a new app:
1.  Open `app_instructions.py`.
2.  Add a new entry to `APP_INSTRUCTIONS` for the app name.

## Prompt for AI Assistant
"I want to change the AI's personality to be more [Trait]. Please edit `personas.py`. Also, I want to add specific instructions for [App Name] in `app_instructions.py`."
