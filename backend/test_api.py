import io
import sys
import os
import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from main import (
    app,
    health_check,
    download_sample_excel,
    process_uploaded_data,
    export_grid,
    ExportRequest,
)

def test_endpoints():
    print("Testing health_check()...")
    health = health_check()
    assert health["status"] == "healthy"
    print("health_check OK:", health["gradingScale"]["grades"])

    print("\nTesting download_sample_excel()...")
    sample_resp = download_sample_excel()
    sample_bytes = sample_resp.body
    assert len(sample_bytes) > 1000
    print("download_sample_excel OK! File size:", len(sample_bytes))

    print("\nTesting process_uploaded_data() with valid sample Excel...")
    result = process_uploaded_data(sample_bytes, "sample.xlsx")
    assert result["success"] is True, f"Upload processing failed: {result}"
    data = result["data"]
    
    assert "CS301" in data["subjects"]
    assert "CS302" in data["subjects"]
    assert "CS303" in data["subjects"]
    cs301 = data["subjects"]["CS301"]
    print(f"CS301 Optimal Lambda: {cs301['optimalLambda']}")
    print(f"CS301 Mean: {cs301['mean']}, SD: {cs301['standardDeviation']}")
    print("CS301 Final Grade Ranges:")
    for gr in cs301["finalGradeRanges"]:
        print(f"  {gr['grade']} ({gr['points']} pts): {gr['range']}")
    
    print(f"CS301 Histogram Before Bins: {len(cs301['histogramBefore'])}")
    print(f"CS301 Histogram After Bins: {len(cs301['histogramAfter'])}")
    print(f"Master Grid total rows: {len(data['masterGrid'])}")
    print("Sample master grid row 1:", data["masterGrid"][0])

    print("\nTesting export_grid()...")
    export_req = ExportRequest(
        subjectCodes=data["subjectCodes"],
        masterGrid=data["masterGrid"]
    )
    export_resp = export_grid(export_req)
    exported_bytes = export_resp.body
    assert len(exported_bytes) > 1000
    df_exp = pd.read_excel(io.BytesIO(exported_bytes))
    assert "Student Register Number" in df_exp.columns
    assert "Student Name" in df_exp.columns
    assert "CS301" in df_exp.columns
    assert "CS302" in df_exp.columns
    assert "CS303" in df_exp.columns
    assert len(df_exp) == 25
    print("Exported Excel structure verified successfully!")

    print("\nTesting validation on invalid marks (< 45 and > 100)...")
    invalid_data = [
        {"Student Register Number": "REG01", "Student Name": "Student A", "CS101": 35.0},  # < 45!
        {"Student Register Number": "REG02", "Student Name": "Student B", "CS101": 108.0}, # > 100!
        {"Student Register Number": "REG03", "Student Name": "Student C", "CS101": 70.0},
    ]
    df_inv = pd.DataFrame(invalid_data)
    inv_buf = io.BytesIO()
    df_inv.to_excel(inv_buf, index=False)
    inv_result = process_uploaded_data(inv_buf.getvalue(), "invalid.xlsx")
    assert inv_result["success"] is False
    assert len(inv_result["errors"]) >= 2
    print("Validation successfully caught errors as expected:")
    for err in inv_result["errors"]:
        print("  -", err)

    print("\n=======================================================")
    print("ALL API AND BOX-COX RELATIVE GRADING TESTS PASSED 100%!")
    print("=======================================================")

if __name__ == "__main__":
    test_endpoints()
