# AI Companion Workshop

Welcome to the **AI Companion Workshop**! In this workshop, you will build a local-first, context-aware AI companion that runs on your machine (macOS or Windows), watches what you do, and offers helpful suggestions.

## 🚀 Project Overview

This project is a **Hybrid AI Companion** that:
1.  **Monitors** your active applications (e.g., Excel, Numbers, Chrome).
2.  **Analyzes** the context (window titles, app state).
3.  **Proactively Suggests** helpful tips using Google's Gemini API.
4.  **Speaks** to you using Text-to-Speech (TTS).
5.  **Listens** to your voice commands (Audio Input).
6.  **Expresses Emotions** (Happy, Thinking, Surprised, etc.).

## 🛠️ Prerequisites

-   **Python 3.12+**
-   **[uv](https://github.com/astral-sh/uv)** (Fast Python package manager)
    -   Install: `curl -LsSf https://astral.sh/uv/install.sh | sh` (macOS/Linux) or `powershell -c "irm https://astral.sh/uv/install.ps1 | iex"` (Windows)
-   **Git**
-   **Google Gemini API Key** (Get one [here](https://aistudio.google.com/app/apikey))

## 💻 Recommended IDE

This workshop is best experienced using an AI-Powered IDE. We recommend **Google Antigravity**.
-   **Download**: [https://antigravity.google/](https://antigravity.google/)

## 🏁 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/frangin2003/my-ai-companion.git
cd my-ai-companion
```

### 2. Switch to the Backend Branch
The workshop code is located in the `backend` branch.
```bash
git checkout backend
```

### 3. Install Dependencies
Use `uv` to sync dependencies. This will create a virtual environment and install everything you need.
```bash
uv sync
```

### 4. Configure Environment
Create a `.env` file from the example and add your API key.
```bash
cp .env.example .env
# Open .env and paste your GEMINI_API_KEY
```

## 🏃‍♂️ Running the App

You will need **two terminal windows**.

### Terminal 1: Start the Server
The server handles the logic, LLM calls, and app monitoring.
```bash
uv run main.py
```
*You should see: `INFO: Uvicorn running on http://0.0.0.0:8000`*

### Terminal 2: Start the Test Client
The `client.py` included here is a **CLI tool for testing the backend**. It allows you to verify that audio recording, TTS, and emotions are working correctly before connecting the real frontend.
```bash
uv run client.py
```
*You should see: `[Client] Connected to ws://localhost:8000/ws`*

## 🎨 Setting up the Frontend

The actual frontend application (with the animated face) is located in the `main` branch of this repository.

1.  **Clone the repository again** into a separate folder (e.g., `ai-companion-frontend`):
    ```bash
    cd ..
    git clone https://github.com/frangin2003/my-ai-companion.git ai-companion-frontend
    cd ai-companion-frontend
    ```
    *(The default branch is `main`, so you don't need to switch branches.)*

2.  **Open in a separate IDE window**:
    Open this new folder in **Google Antigravity** (or your preferred IDE).

3.  **Follow the instructions** in that folder's `README.md` to start the frontend.

## 🎙️ Features & Usage (Test Client)

### 🗣️ Talk to the AI
-   In the client terminal, type `/record` to record 5 seconds of audio.
-   Type `/record 10` to record for 10 seconds.
-   The AI will transcribe your voice and respond!

### 💬 Text Chat
-   Simply type your message in the client terminal and press Enter.

### 👁️ Context Awareness
-   Switch to **Microsoft Excel** (Windows) or **Apple Numbers** (macOS).
-   The AI will detect the app and offer a context-aware suggestion (e.g., "I see you're using Excel...").

### 🎭 Emotions
-   The AI returns an **emotion** with every reply (e.g., `happy`, `thinking`).
-   The client displays the emotion in the log (and the frontend, if connected, would show a face!).

## 📂 Project Structure

-   `app/server.py`: The main WebSocket server.
-   `app/llm/`: Logic for calling Gemini (Text & Audio).
-   `app/tts/`: Text-to-Speech modules.
-   `app/apps/`: App monitoring and integration logic.
-   `client.py`: The CLI client.

## ❓ Troubleshooting

-   **"WebSocket error"**: Make sure the server is running in Terminal 1.
-   **"Audio device error"**: Ensure you have a microphone connected and permissions granted.
-   **"Gemini API error"**: Check your `GEMINI_API_KEY` in `.env`.

Happy Coding! 🤖✨
