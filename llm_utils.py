# llm_simple.py

import asyncio
from typing import Any, Dict, List, Optional

from langchain_core.messages import HumanMessage, SystemMessage, AIMessage, BaseMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.chat_models import ChatOllama

# For gemini-live (non-LangChain)
from google import genai
from google.genai.types import Content, Part


# ---------- CONFIG SHAPE ----------

# config example you pass in:
#
# config = {
#     "gemini_api_key": "XXX",
#     "gemini_default_model": "gemini-2.5-flash",
#     "gemini_live_model": "gemini-2.5-flash-native-audio-preview-09-2025",
#     "ollama_base_url": "http://localhost:11434",
#     "ollama_default_model": "llama3.1"
# }
#
# backends supported:
#   - "gemini"       -> LangChain ChatGoogleGenerativeAI (text)
#   - "ollama"       -> LangChain ChatOllama (text)
#   - "gemini-live"  -> google-genai client (text in -> text out via live-capable model)


# ---------- LLM CREATION (LANGCHAIN BACKENDS) ----------

def create_llm(
    backend: str,
    config: Dict[str, Any],
    model: Optional[str] = None,
    **kwargs: Any,
):
    """
    Create a LangChain chat model for either Gemini or Ollama.
    (NOT used for gemini-live, which goes through google-genai directly.)
    """
    backend = backend.lower()

    if backend == "gemini":
        return ChatGoogleGenerativeAI(
            model=model or config.get("gemini_default_model", "gemini-1.5-flash"),
            google_api_key=config["gemini_api_key"],
            streaming=False,
            **kwargs,
        )

    if backend == "ollama":
        return ChatOllama(
            model=model or config.get("ollama_default_model", "llama3.1"),
            base_url=config.get("ollama_base_url", "http://localhost:11434"),
            streaming=False,
            **kwargs,
        )

    raise ValueError(f"Unsupported backend for create_llm: {backend}")


# ---------- MESSAGE CONVERSION FOR LANGCHAIN ----------

def _convert_messages(messages: List[Dict[str, str]]) -> List[BaseMessage]:
    """
    Convert simple dict messages into LangChain message objects.

    messages = [
      {"role": "system", "content": "..."},
      {"role": "user", "content": "..."},
      {"role": "assistant", "content": "..."},
    ]
    """
    lc_messages: List[BaseMessage] = []

    for m in messages:
        role = m.get("role", "user")
        content = m.get("content", "")

        if role == "system":
            lc_messages.append(SystemMessage(content=content))
        elif role == "assistant":
            lc_messages.append(AIMessage(content=content))
        else:  # default to user
            lc_messages.append(HumanMessage(content=content))

    return lc_messages


# ---------- GEMINI-LIVE (google-genai) IMPLEMENTATION ----------

async def _chat_gemini_live(
    config: Dict[str, Any],
    messages: List[Dict[str, str]],
    model: Optional[str] = None,
    audio_data: Optional[bytes] = None,
    **kwargs: Any,
) -> str:
    """
    Text-in -> text-out using a gemini-live-capable model via google-genai.

    This still uses a simple generate_content call, but against a live-capable
    model like "gemini-2.5-flash-native-audio-preview-09-2025".
    """
    api_key = config["gemini_api_key"]
    live_model = model or config.get(
        "gemini_live_model",
        "gemini-2.5-flash-native-audio-preview-09-2025",
    )

    client = genai.Client(api_key=api_key)

    # Convert our messages into Gemini Content objects
    contents: List[Content] = []
    for m in messages:
        role = m.get("role", "user")
        txt = m.get("content", "")

        # Map roles: "assistant" -> "model", others -> "user" or "system"
        if role == "assistant":
            g_role = "model"
        elif role == "system":
            g_role = "user"  # simplest mapping; you can encode system separately if you like
            txt = f"[SYSTEM] {txt}"
        else:
            g_role = "user"

        parts = [Part(text=txt)]
        if audio_data and g_role == "user":
             # Assuming the audio is associated with the last user message or we attach it to this one
             # For simplicity, if audio_data is passed, we attach it to the user message
             parts.append(Part.from_bytes(data=audio_data, mime_type="audio/wav")) # Defaulting to wav

        contents.append(
            Content(
                role=g_role,
                parts=parts,
            )
        )

    # If audio_data was provided but not attached (e.g. no user message), attach it to a new one
    # (Simplification: assume caller structures messages correctly or we just attach to the last one if not done)
    # Better approach: just process parts.

    # RE-IMPLEMENTATION for safer audio attachment:
    # We will reconstruct contents.
    
    contents = []
    for m in messages:
        role = m.get("role", "user")
        txt = m.get("content", "")
        
        if role == "assistant":
            g_role = "model"
        else:
            g_role = "user"
            if role == "system":
                txt = f"[SYSTEM] {txt}"
        
        contents.append(Content(role=g_role, parts=[Part(text=txt)]))

    if audio_data:
        # Add audio to the last user message, or create a new one if none exists
        if contents and contents[-1].role == "user":
            contents[-1].parts.append(Part.from_bytes(data=audio_data, mime_type="audio/wav"))
        else:
            contents.append(Content(role="user", parts=[Part.from_bytes(data=audio_data, mime_type="audio/wav")]))

    # Call generate_content in a thread so we don't block the event loop
    def _call_generate():
        return client.models.generate_content(
            model=live_model,
            contents=contents,
            config={
                # We only want TEXT back here, even though model can do audio
                "response_modalities": ["TEXT"],
                **kwargs,
            },
        )

    resp = await asyncio.to_thread(_call_generate)

    # Extract text (google-genai usually has resp.text convenience)
    if getattr(resp, "text", None):
        return resp.text

    # Fallback: manually concatenate text parts
    out_chunks: List[str] = []
    for cand in getattr(resp, "candidates", []) or []:
        for part in getattr(cand, "content", Content()).parts or []:
            if part.text:
                out_chunks.append(part.text)

    return "".join(out_chunks).strip()


# ---------- MAIN ENTRYPOINT: TEXT IN → TEXT OUT ----------

async def chat_messages(
    backend: str,
    config: Dict[str, Any],
    messages: List[Dict[str, str]],
    model: Optional[str] = None,
    audio_data: Optional[bytes] = None,
    **kwargs: Any,
) -> str:
    """
    Core function:
    - chooses backend ("gemini", "ollama", "gemini-live")
    - takes chat messages
    - returns a single final text response (no streaming)
    """
    backend = backend.lower()

    if backend in ("gemini", "ollama"):
        # LangChain path
        # Note: LangChain path currently ignores audio_data
        llm = create_llm(backend=backend, config=config, model=model, **kwargs)
        lc_messages = _convert_messages(messages)
        response = await llm.ainvoke(lc_messages)
        return response.content if isinstance(response.content, str) else str(response.content)

    if backend == "gemini-live":
        # google-genai path (live-capable model, but we use it in text mode)
        return await _chat_gemini_live(
            config=config,
            messages=messages,
            model=model,
            audio_data=audio_data,
            **kwargs,
        )

    raise ValueError(f"Unsupported backend: {backend} (use 'gemini', 'ollama', or 'gemini-live')")


async def chat_simple(
    backend: str,
    config: Dict[str, Any],
    user_text: str,
    system_prompt: Optional[str] = None,
    model: Optional[str] = None,
    audio_data: Optional[bytes] = None,
    **kwargs: Any,
) -> str:
    """
    Convenience wrapper when you just have user text (no history).
    """
    msgs: List[Dict[str, str]] = []
    if system_prompt:
        msgs.append({"role": "system", "content": system_prompt})
    msgs.append({"role": "user", "content": user_text})

    return await chat_messages(
        backend=backend,
        config=config,
        messages=msgs,
        model=model,
        audio_data=audio_data,
        **kwargs,
    )


# ---------- EXAMPLE USAGE ----------

# import asyncio
#
# async def main():
#
#     # Simple one-shot call to Gemini (text)
#     reply = await chat_simple(
#         backend="gemini",
#         config=config,
#         user_text="Explain WebSockets in one paragraph.",
#         system_prompt="You are a concise technical assistant.",
#         temperature=0.3,
#     )
#     print("Gemini:", reply)
#
#     # Simple one-shot call to Ollama (text)
#     reply2 = await chat_simple(
#         backend="ollama",
#         config=config,
#         user_text="Explain WebSockets in one paragraph.",
#         system_prompt="You are a concise technical assistant.",
#         temperature=0.3,
#     )
#     print("Ollama:", reply2)
#
#     # Simple one-shot call to gemini-live backend (using live-capable model in text mode)
#     reply3 = await chat_simple(
#         backend="gemini-live",
#         config=config,
#         user_text="Explain WebSockets in one paragraph.",
#         system_prompt="You are a concise technical assistant.",
#         temperature=0.3,
#     )
#     print("Gemini Live (text mode):", reply3)
#
# if __name__ == "__main__":
#     asyncio.run(main())
