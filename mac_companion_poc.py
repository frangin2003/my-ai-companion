import os
import time
import google.generativeai as genai
from AppKit import NSWorkspace
from dotenv import load_dotenv

load_dotenv()

import subprocess

def get_active_app_name_applescript():
    """Returns the active app name using AppleScript (slower but sometimes more reliable)."""
    script = 'tell application "System Events" to name of first application process whose frontmost is true'
    try:
        result = subprocess.run(['osascript', '-e', script], capture_output=True, text=True)
        return result.stdout.strip()
    except Exception:
        return None

def get_active_app_name():
    """Returns the localized name of the currently focused application."""
    # Try AppleScript first (more reliable in CLI without RunLoop)
    name = get_active_app_name_applescript()
    if name:
        return name

    # Fallback to AppKit
    try:
        active_app = NSWorkspace.sharedWorkspace().frontmostApplication()
        if active_app:
            return active_app.localizedName()
    except Exception:
        pass
    
    return None

def generate_suggestion(app_name):
    """Generates a context-aware suggestion using Gemini API."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("[Error] GEMINI_API_KEY not found in environment variables.")
        return "I need an API key to think."

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-2.5-flash')
    
    prompt = (
        f"You are an expert Apple Numbers and spreadsheet assistant. "
        f"The user has just opened the application: {app_name}. "
        f"In one short, casual sentence, give a powerful keyboard shortcut or a formula tip specific to Apple Numbers. "
        f"Do not be formal."
    )
    
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"[Error] Gemini API failed: {e}")
        return "I couldn't think of a tip right now."

def speak_text(text):
    """Speaks the given text using the native macOS 'say' command."""
    # Escape double quotes to prevent shell injection/errors
    safe_text = text.replace('"', '\\"')
    os.system(f'say -r 180 "{safe_text}"')

def main():
    print("[System] Companion initialized. Watching for: Numbers...")
    print("[Info] If detection is stuck, ensure Terminal has Accessibility permissions.")
    
    target_app = "Numbers"
    previous_app = None
    
    try:
        while True:
            current_app = get_active_app_name()
            # Fallback if AppKit returns None
            if not current_app:
                 current_app = get_active_app_name_applescript()

            if current_app != previous_app:
                print(f"[Status] Current App: {current_app}")
                
                if current_app == target_app and previous_app != target_app:
                    print(f"[Event] User switched to {target_app}!")
                    print("[AI] Thinking...")
                    
                    suggestion = generate_suggestion(current_app)
                    print(f"[AI Suggestion] \"{suggestion}\"")
                    
                    print("[Voice] Speaking...")
                    speak_text(suggestion)
            
            previous_app = current_app
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\n[System] Companion stopping...")

if __name__ == "__main__":
    main()
