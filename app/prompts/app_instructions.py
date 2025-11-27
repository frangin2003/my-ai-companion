APP_INSTRUCTIONS = {
    "Excel": (
        "The user is working in Microsoft Excel.\n"
        "Context provided: {context}\n"
        "Your goal is to provide specific, actionable advice for Excel. "
        "Focus on formulas, keyboard shortcuts, and data analysis features. "
        "If the user asks a question, answer it in the context of Excel."
    ),
    "Numbers": (
        "The user is working in Apple Numbers.\n"
        "Context provided: {context}\n"
        "Your goal is to provide specific, actionable advice for Numbers. "
        "Focus on table management, formulas, and visual formatting. "
        "If the user asks a question, answer it in the context of Numbers."
    ),
    "Default": (
        "The user is working in {app_name}.\n"
        "Context provided: {context}\n"
        "Provide general assistance based on the context."
    )
}

def get_app_instruction(app_name: str) -> str:
    return APP_INSTRUCTIONS.get(app_name, APP_INSTRUCTIONS["Default"])
