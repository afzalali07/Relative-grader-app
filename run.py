"""
Relative Grading System - Application Launcher
Runs the FastAPI backend and serves the React frontend on http://127.0.0.1:8000
"""

import sys
import os
import webbrowser
import uvicorn

if __name__ == "__main__":
    # Ensure backend directory is in python path
    backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
    sys.path.insert(0, backend_dir)

    print("=" * 65)
    print("      Relative Grading System (Box-Cox Transformation)       ")
    print("=" * 65)
    print("-> Web App URL: http://127.0.0.1:8000")
    print("-> API Docs:    http://127.0.0.1:8000/docs")
    print("-> Press Ctrl+C to shut down.")
    print("=" * 65)

    # Optional: open browser after 1.5s
    try:
        import threading
        def open_browser():
            import time
            time.sleep(1.5)
            webbrowser.open("http://127.0.0.1:8000")
        threading.Thread(target=open_browser, daemon=True).start()
    except Exception:
        pass

    # Launch uvicorn
    uvicorn.run("main:app", app_dir=backend_dir, host="127.0.0.1", port=8000, reload=True)
