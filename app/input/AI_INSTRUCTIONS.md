# Input Module Instructions

This module handles user input (Text, Audio, etc.).

## How to Extend
To implement the Audio Input:
1.  Open `audio.py`.
2.  Implement the `record` method using a library like `sounddevice` or `pyaudio`.
3.  Implement the `transcribe` method using an STT API (e.g., OpenAI Whisper, Google Speech-to-Text).

## Prompt for AI Assistant
"I want to implement audio recording and transcription in `audio.py`. Please provide the code to record audio from the microphone and transcribe it using [Service Name]."
