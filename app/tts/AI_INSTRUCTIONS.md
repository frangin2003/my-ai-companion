# TTS Module Instructions

This module handles Text-to-Speech functionality.

## How to Extend
To add a new TTS provider (e.g., ElevenLabs, OpenAI Audio):
1.  Create a new file (e.g., `elevenlabs.py`).
2.  Inherit from `TTSProvider` in `base.py`.
3.  Implement the `speak` method.

## Prompt for AI Assistant
"I want to add a new TTS provider to this module. Please create a class that inherits from `TTSProvider` and implements the `speak` method using [Provider Name]'s API."
