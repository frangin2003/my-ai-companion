import subprocess
from AppKit import NSWorkspace
from .base import AppProvider

class NumbersApp(AppProvider):
    def get_active_app_name(self) -> str:
        # Try AppleScript first
        script = 'tell application "System Events" to name of first application process whose frontmost is true'
        try:
            result = subprocess.run(['osascript', '-e', script], capture_output=True, text=True)
            name = result.stdout.strip()
            if name:
                return name
        except Exception:
            pass

        # Fallback to AppKit
        try:
            active_app = NSWorkspace.sharedWorkspace().frontmostApplication()
            if active_app:
                return active_app.localizedName()
        except Exception:
            pass
        
        return None

    def is_target_app(self, app_name: str) -> bool:
        return app_name == "Numbers"

    def get_context(self) -> str:

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
