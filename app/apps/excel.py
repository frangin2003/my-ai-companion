import win32gui
import win32process
import psutil
import win32com.client
from .base import AppProvider

class ExcelApp(AppProvider):
    def get_active_app_name(self) -> str:
        try:
            hwnd = win32gui.GetForegroundWindow()
            _, pid = win32process.GetWindowThreadProcessId(hwnd)
            process = psutil.Process(pid)
            # Returns e.g. "EXCEL.EXE"
            return process.name().replace(".exe", "").replace(".EXE", "")
        except Exception:
            return None

    def is_target_app(self, app_name: str) -> bool:
        if not app_name:
            return False
        return app_name.lower() == "excel"

    def get_context(self) -> str:
        try:
            # Connect to active Excel instance
            # This requires Excel to be running
            try:
                excel = win32com.client.GetActiveObject("Excel.Application")
            except Exception:
                return "Excel is not running or not accessible."

            wb = excel.ActiveWorkbook
            if not wb:
                return "No workbook open"
            
            sheet = excel.ActiveSheet
            selection = excel.Selection
            
            context = f"Workbook: {wb.Name}, Sheet: {sheet.Name}"
            
            try:
                # Try to get selection info
                context += f", Selection: {selection.Address}"
                
                # Simple heuristic to avoid dumping huge data
                if selection.Count <= 10:
                    val = selection.Value
                    if val:
                        context += f", Value: {val}"
            except Exception:
                 pass
                
            return context
        except Exception as e:
            return f"Error getting context: {e}"
