def get_text_input(prompt: str = "You: ") -> str:
    """Gets text input from the user via the command line."""
    try:
        return input(prompt)
    except EOFError:
        return ""
