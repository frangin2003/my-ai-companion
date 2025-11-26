# LLM Module Instructions

This module handles interactions with Large Language Models.

## How to Extend
To add a new LLM provider (e.g., OpenAI, Anthropic):
1.  Create a new file (e.g., `openai.py`).
2.  Inherit from `LLMProvider` in `base.py`.
3.  Implement the `generate` method.
4.  **Configuration**: Use `app.config.settings` to access API keys and other settings. Add new keys to `app/config.py` and `.env` if needed.

## Prompt for AI Assistant
"I want to add a new LLM provider to this module. Please create a class that inherits from `LLMProvider` and implements the `generate` method using [Provider Name]'s API."
