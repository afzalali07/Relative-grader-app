from fastapi import FastAPI, UploadFile, File, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from relative_grader import (
    parse_and_validate_excel,
    run_relative_grading_pipeline,
    export_grid_to_excel,
    generate_sample_excel,
    PASS_MARK,
    MAX_MARK,
    GRADES,
    POINTS,
    K_VALUES
)

app = FastAPI(
    title="Relative Grading System API",
    description="Relative Grading System API using Box-Cox Transformation",
    version="1.0.0"
)

# Enable CORS for frontend Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def process_uploaded_data(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    subject_cols, student_rows, errors = parse_and_validate_excel(file_bytes)

    if errors:
        return {
            "success": False,
            "filename": filename,
            "errors": errors,
            "totalRowsRead": len(student_rows)
        }

    try:
        result = run_relative_grading_pipeline(subject_cols, student_rows)
        return {
            "success": True,
            "filename": filename,
            "errors": [],
            "data": result
        }
    except Exception as e:
        return {
            "success": False,
            "filename": filename,
            "errors": [str(e)],
            "data": None
        }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Relative Grading System",
        "gradingScale": {
            "grades": GRADES,
            "points": POINTS,
            "kValues": K_VALUES,
            "passMark": PASS_MARK,
            "maxMark": MAX_MARK
        }
    }


@app.get("/api/sample-excel")
def download_sample_excel():
    excel_bytes = generate_sample_excel()
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="relative_grading_sample.xlsx"'}
    )


@app.post("/api/grade/upload")
async def upload_and_grade(file: UploadFile = File(...)):
    if not (file.filename.endswith(".xlsx") or file.filename.endswith(".xls")):
        raise HTTPException(
            status_code=400,
            detail="Invalid file format. Please upload an Excel (.xlsx or .xls) file."
        )

    file_bytes = await file.read()
    return process_uploaded_data(file_bytes, file.filename)


class ExportRequest(BaseModel):
    subjectCodes: List[str]
    masterGrid: List[Dict[str, Any]]


@app.post("/api/grade/export")
def export_grid(payload: ExportRequest):
    if not payload.masterGrid:
        raise HTTPException(status_code=400, detail="No grid data provided to export.")
    
    excel_bytes = export_grid_to_excel(payload.subjectCodes, payload.masterGrid)
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="relative_grading_master_grid.xlsx"'}
    )


# Serve built React frontend if dist exists
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="API route not found")
        file_path = os.path.join(frontend_dist, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
