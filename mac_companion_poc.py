import os
import time
import google.generativeai as genai
from AppKit import NSWorkspace
from dotenv import load_dotenv
import subprocess

load_dotenv()

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

def get_numbers_context():
    """Retrieves context from the active Numbers document using AppleScript."""
    script = '''
    tell application "Numbers"
        if not (exists document 1) then return "No document open"
        tell document 1
            set docName to name
            tell active sheet
                set sheetName to name
                try
                    tell first table
                        set tableName to name
                        set rowCount to row count
                        set colCount to column count
                        return "Document: " & docName & ", Sheet: " & sheetName & ", Table: " & tableName & ", Rows: " & rowCount & ", Columns: " & colCount
                    end tell
                on error
                    return "Document: " & docName & ", Sheet: " & sheetName & " (No table found)"
                end try
            end tell
        end tell
    end tell
    '''
    try:
        result = subprocess.run(['osascript', '-e', script], capture_output=True, text=True)
        return result.stdout.strip()
    except Exception as e:
        return f"Error getting context: {e}"

def generate_suggestion(app_name, context=None):
    """Generates a context-aware suggestion using Gemini API."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("[Error] GEMINI_API_KEY not found in environment variables.")
        return "I need an API key to think."

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-2.5-flash')
    
    prompt = (
        f"You are an expert Apple Numbers and spreadsheet assistant. "
        f"The user is currently working in {app_name}. "
    )
    
    if context:
        prompt += f"Here is the current context of the spreadsheet: {context}. "
        
    prompt += (
        f"Based on this context (if available) or just the fact that they are using Numbers, "
        f"in one short, casual sentence, give a powerful keyboard shortcut, a formula tip, or an insight specific to what they might be doing. "
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
    print("[Info] Monitoring interval: 10s. Suggestion cooldown: 60s.")
    
    target_app = "Numbers"
    previous_app = None
    last_suggestion_time = 0
    suggestion_cooldown = 60  # seconds
    
    try:
        while True:
            current_app = get_active_app_name()
            # Fallback if AppKit returns None
            if not current_app:
                 current_app = get_active_app_name_applescript()

            if current_app != previous_app:
                print(f"[Status] Current App: {current_app}")
                
                if current_app == target_app:
                    current_time = time.time()
                    if current_time - last_suggestion_time >= suggestion_cooldown:
                        print(f"[Event] User switched to {target_app}!")
                        
                        context = get_numbers_context()
                        print(f"[Context] {context}")
                        
                        print("[AI] Thinking...")
                        suggestion = generate_suggestion(current_app, context)
                        print(f"[AI Suggestion] \"{suggestion}\"")
                        
                        print("[Voice] Speaking...")
                        speak_text(suggestion)
                        
                        last_suggestion_time = current_time
                    else:
                        print(f"[Info] Suggestion cooldown active. {int(suggestion_cooldown - (current_time - last_suggestion_time))}s remaining.")
            
            previous_app = current_app
            time.sleep(10) # Slower monitoring
            
    except KeyboardInterrupt:
        print("\n[System] Companion stopping...")

if __name__ == "__main__":
    main()
