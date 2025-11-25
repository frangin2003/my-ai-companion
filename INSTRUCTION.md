# AI Companion Workshop Instructions

**Welcome, AI Assistant!**

You are helping a participant in the **macOS AI Companion Workshop**. This project is a modular, local-first AI companion that monitors macOS applications and provides context-aware assistance.

## Project Overview

- **Goal**: Build an AI companion that "watches" what the user is doing (e.g., in Apple Numbers) and proactively offers help or answers questions with context.
- **Architecture**:
    - **Server**: A FastAPI WebSocket server (`app/server.py`) that handles app monitoring and LLM processing.
    - **Client**: A CLI client (`client.py`) that connects to the server via WebSockets to display messages and accept input.
    - **Communication**: Event-driven JSON messages (see `SERVER_SPEC.md`).

## Technology Stack

- **Language**: Python 3.12+
- **Package Manager**: `uv`
- **Key Libraries**: `fastapi`, `uvicorn`, `websockets`, `google-generativeai`, `pyobjc`, `prompt_toolkit`.

## How to Operate

### Running the Project
1.  **Start the Server**:
    ```bash
    uv run main.py
    ```
    This starts the WebSocket server on `ws://localhost:8000/ws`.

2.  **Start the Client**:
    Open a new terminal and run:
    ```bash
    uv run client.py
    ```

### Directory Structure & Modules

The project is structured into modular components within the `app/` directory. **If the user asks you to modify a specific part of the system, refer to the specific instructions file for that module:**

- **LLM Logic** (Gemini, etc.):
    - Path: `app/llm/`
    - Instructions: `app/llm/AI_INSTRUCTIONS.md`

- **Text-to-Speech** (TTS):
    - Path: `app/tts/`
    - Instructions: `app/tts/AI_INSTRUCTIONS.md`

- **App Integration** (Monitoring Numbers, etc.):
    - Path: `app/apps/`
    - Instructions: `app/apps/AI_INSTRUCTIONS.md`

- **User Input** (Text, Audio):
    - Path: `app/input/`
    - Instructions: `app/input/AI_INSTRUCTIONS.md`

- **Prompts & Personas**:
    - Path: `app/prompts/`
    - Instructions: `app/prompts/AI_INSTRUCTIONS.md`

## Protocol Specification

All communication between Client and Server follows the protocol defined in:
- **`SERVER_SPEC.md`** (Read this to understand event types like `thinking_start`, `suggestion`, `reply`, and `message`).

## Your Role

1.  **Guide**: Help the user understand the architecture.
2.  **Implement**: Write code to add new features (e.g., "Add support for Excel", "Add OpenAI support").
3.  **Debug**: Help fix issues with connections or logic.
4.  **Teach**: Explain *why* the code is structured this way (modularity, separation of concerns).

**Always check the specific module's `AI_INSTRUCTIONS.md` before making changes to that module.**
