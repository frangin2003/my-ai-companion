import sys
import subprocess

# Conditional imports
if sys.platform == "win32":
    import win32gui
    import win32process
    import psutil

class SystemMonitor:
    def get_active_app_name(self) -> str:
        if sys.platform == "win32":
            try:
                hwnd = win32gui.GetForegroundWindow()
                _, pid = win32process.GetWindowThreadProcessId(hwnd)
                process = psutil.Process(pid)
                return process.name().replace(".exe", "").replace(".EXE", "")
            except Exception:
                return None
        elif sys.platform == "darwin":
            # AppleScript to get frontmost app
            script = 'tell application "System Events" to name of first application process whose frontmost is true'
            try:
                result = subprocess.run(['osascript', '-e', script], capture_output=True, text=True)
                name = result.stdout.strip()
                if name:
                    return name
            except Exception:
                pass
            return None
        return None

    def get_active_window_title(self, app_name: str) -> str:
        if not app_name:
            return None
            
        if sys.platform == "win32":
            try:
                hwnd = win32gui.GetForegroundWindow()
                return win32gui.GetWindowText(hwnd)
            except Exception:
                return None
        elif sys.platform == "darwin":
            script = f'tell application "System Events" to name of window 1 of process "{app_name}"'
            try:
                result = subprocess.run(['osascript', '-e', script], capture_output=True, text=True)
                return result.stdout.strip()
            except Exception:
                return None
        return None
