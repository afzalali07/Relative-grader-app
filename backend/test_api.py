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
    recalculate_grading,
    RecalculateRequest,
    export_grid,
    ExportRequest,
)

def test_endpoints():
    print("Testing health_check()...")
    health = health_check()
    assert health["status"] == "healthy"
    assert health["gradingScale"]["kValues"]["A+"] == 0.75
    assert health["gradingScale"]["kValues"]["B"] == -2.0
    print("health_check OK with new defaults:", health["gradingScale"]["kValues"])

    print("\nTesting download_sample_excel()...")
    sample_resp = download_sample_excel()
    sample_bytes = sample_resp.body
    assert len(sample_bytes) > 1000
    print("download_sample_excel OK! File size:", len(sample_bytes))

    print("\nTesting process_uploaded_data() with new default boundaries...")
    result = process_uploaded_data(sample_bytes, "sample.xlsx")
    assert result["success"] is True, f"Upload processing failed: {result}"
    data = result["data"]
    
    assert "CS301" in data["subjects"]
    assert "CS302" in data["subjects"]
    assert "CS303" in data["subjects"]
    cs301 = data["subjects"]["CS301"]
    print(f"CS301 Optimal Lambda: {cs301['optimalLambda']}")
    print(f"CS301 Mean: {cs301['mean']}, SD: {cs301['standardDeviation']}")
    print("CS301 Final Grade Ranges with 1.5, 0.75, 0, -0.75, -2.0:")
    for gr in cs301["finalGradeRanges"]:
        print(f"  {gr['grade']} ({gr['points']} pts): {gr['range']}")
    
    print("\nTesting recalculate_grading() with custom user boundaries...")
    custom_k = {
        "O": 1.8,
        "A+": 1.1,
        "A": 0.2,
        "B+": -0.6,
        "B": -1.8
    }
    recalc_req = RecalculateRequest(
        subjectCodes=data["subjectCodes"],
        studentRows=data["studentRows"],
        kValues=custom_k
    )
    recalc_res = recalculate_grading(recalc_req)
    assert recalc_res["success"] is True, f"Recalculation failed: {recalc_res}"
    recalc_data = recalc_res["data"]
    cs301_recalc = recalc_data["subjects"]["CS301"]
    assert cs301_recalc["kValues"]["O"] == 1.8
    print("Custom user boundaries recalculated successfully!")
    print("CS301 Recalculated Ranges:")
    for gr in cs301_recalc["finalGradeRanges"]:
        print(f"  {gr['grade']}: {gr['range']}")

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
    assert len(df_exp) == 25
    print("Exported Excel structure verified successfully!")

    print("\nTesting validation on invalid marks (< 45 and > 100)...")
    invalid_data = [
        {"Student Register Number": "REG01", "Student Name": "Student A", "CS101": 35.0},
        {"Student Register Number": "REG02", "Student Name": "Student B", "CS101": 108.0},
        {"Student Register Number": "REG03", "Student Name": "Student C", "CS101": 70.0},
    ]
    df_inv = pd.DataFrame(invalid_data)
    inv_buf = io.BytesIO()
    df_inv.to_excel(inv_buf, index=False)
    inv_result = process_uploaded_data(inv_buf.getvalue(), "invalid.xlsx")
    assert inv_result["success"] is False
    assert len(inv_result["errors"]) >= 2
    print("Validation successfully caught errors as expected!")

    print("\n=======================================================")
    print("ALL API AND CUSTOM BOUNDARY TESTS PASSED 100%!")
    print("=======================================================")

if __name__ == "__main__":
    test_endpoints()
