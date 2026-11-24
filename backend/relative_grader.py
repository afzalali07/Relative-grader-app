import math
import re
from typing import Dict, List, Any, Optional, Tuple
import numpy as np
import pandas as pd
from scipy.stats import boxcox
import io

DEFAULT_K_VALUES = {
    "O": 1.5,
    "A+": 0.75,
    "A": 0.0,
    "B+": -0.75,
    "B": -2.0,
}
K_VALUES = DEFAULT_K_VALUES.copy()

GRADES = ["O", "A+", "A", "B+", "B", "C"]
# U = fail/absent, not included in relative grading
POINTS = {"O": 10, "A+": 9, "A": 8, "B+": 7, "B": 6, "C": 5, "U": 0}
PASS_MARK = 45.0
MAX_MARK = 100.0


def validate_k_values(k_values: Optional[Dict[str, Any]]) -> Dict[str, float]:
    """
    Validates that k_values contains O, A+, A, B+, B as numbers in strictly descending order.
    Returns normalized dictionary or a copy of DEFAULT_K_VALUES.
    """
    if not k_values:
        return DEFAULT_K_VALUES.copy()

    required = ["O", "A+", "A", "B+", "B"]
    parsed_k: Dict[str, float] = {}
    for grade in required:
        if grade not in k_values or k_values[grade] is None:
            raise ValueError(f"Missing grade boundary multiplier for '{grade}'.")
        try:
            parsed_k[grade] = float(k_values[grade])
        except (ValueError, TypeError):
            raise ValueError(f"Multiplier for grade '{grade}' must be a valid number.")

    # Check strictly descending
    vals = [parsed_k[g] for g in required]
    for i in range(len(vals) - 1):
        if vals[i] <= vals[i + 1]:
            raise ValueError(
                f"Grade boundaries must be in strictly descending order: "
                f"Grade '{required[i]}' ({vals[i]}) must be greater than '{required[i+1]}' ({vals[i+1]})."
            )

    return parsed_k


def natural_sort_key(s: str) -> List[Any]:
    """
    Sort key for alphanumeric strings so that e.g. REG1, REG2, REG10 are in correct order.
    """
    return [int(text) if text.isdigit() else text.lower() for text in re.split(r'(\d+)', str(s))]



def inverse_boxcox(y: float, lam: float) -> float:
    """
    Inverse Box-Cox transformation:
    If lam == 0: exp(y)
    Else: (1 + lam * y) ** (1 / lam)
    """
    if abs(lam) < 1e-8:
        return float(np.exp(y))

    base = 1.0 + lam * y
    if base <= 0:
        raise ValueError(
            f"Boundary value {y:.4f} with lambda {lam:.4f} results in base {base:.4f} <= 0, outside inverse Box-Cox domain."
        )

    return float(base ** (1.0 / lam))


def compute_histogram_bins(data: np.ndarray, num_bins: int = 8) -> List[Dict[str, Any]]:
    """
    Computes histogram bins with counts, range labels, and min/max for charting.
    """
    counts, bin_edges = np.histogram(data, bins=num_bins)
    bins = []
    for i in range(len(counts)):
        b_min = float(bin_edges[i])
        b_max = float(bin_edges[i + 1])
        bins.append({
            "binIndex": i,
            "label": f"{b_min:.1f} - {b_max:.1f}",
            "binMin": round(b_min, 4),
            "binMax": round(b_max, 4),
            "count": int(counts[i]),
            "midpoint": round((b_min + b_max) / 2.0, 4)
        })
    return bins


def _is_absent_value(val) -> bool:
    """Returns True if the cell value represents an absent student (AB)."""
    if val is None:
        return False
    s = str(val).strip().upper()
    return s in ("AB", "ABSENT", "A/B")


def process_subject_grading(
    subject_code: str,
    student_records: List[Dict[str, Any]],
    k_values: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Performs Box-Cox relative grading for a single subject.
    student_records is a list of dicts: {'register_number', 'name', 'mark', 'isAbsent' (optional), 'isFail' (optional)}

    Students with mark < 45 OR isAbsent=True are excluded from Box-Cox and assigned grade U (fail).
    """
    active_k = validate_k_values(k_values)

    # Separate students:
    # - U-grade students: absent (isAbsent=True) or mark < PASS_MARK
    # - Gradable students: mark >= PASS_MARK and not absent
    u_students = []
    gradable_students = []

    for s in student_records:
        mark = s.get("mark")
        is_absent = s.get("isAbsent", False)
        is_null = mark is None or (isinstance(mark, float) and np.isnan(mark))

        if is_absent or is_null:
            u_students.append({**s, "grade": "U", "reason": "absent"})
        elif float(mark) < PASS_MARK:
            u_students.append({**s, "grade": "U", "reason": "fail"})
        else:
            gradable_students.append(s)

    n = len(gradable_students)
    if n < 2:
        # If fewer than 2 gradable students, all get U
        all_results = []
        for s in u_students:
            orig_m = float(s["mark"]) if s.get("mark") is not None and not (isinstance(s.get("mark"), float) and np.isnan(s.get("mark"))) else None
            all_results.append({
                "registerNumber": str(s.get("register_number", "")),
                "studentName": str(s.get("name", "")),
                "originalMark": round(orig_m, 2) if orig_m is not None else None,
                "transformedScore": None,
                "grade": "U",
                "points": 0,
                "isAbsent": s.get("reason") == "absent",
            })
        for s in gradable_students:
            orig_m = float(s["mark"])
            all_results.append({
                "registerNumber": str(s.get("register_number", "")),
                "studentName": str(s.get("name", "")),
                "originalMark": round(orig_m, 2),
                "transformedScore": None,
                "grade": "U",
                "points": 0,
                "isAbsent": False,
            })
        all_results.sort(key=lambda item: natural_sort_key(item["registerNumber"]))
        raise ValueError(
            f"Subject '{subject_code}' has only {n} gradable student mark(s) (≥{PASS_MARK}). At least 2 students are required for Box-Cox transformation."
        )

    marks = np.array([float(s["mark"]) for s in gradable_students], dtype=float)

    # Check variation
    if np.all(marks == marks[0]):
        raise ValueError(
            f"Subject '{subject_code}' all gradable students have identical marks ({marks[0]}). Variance must be non-zero for Box-Cox transformation."
        )

    # Step 1: Find optimal lambda and perform Box-Cox
    transformed, lam = boxcox(marks)
    lam = float(lam)

    # Step 2: Mean and standard deviation (ddof=0 as in sample code)
    mean_val = float(np.mean(transformed))
    sd_val = float(np.std(transformed, ddof=0))

    # Step 3: Calculate transformed grade boundaries
    boundaries = []
    transformed_boundaries_info = []
    for grade in GRADES[:-1]:  # Excludes "C"
        k = active_k[grade]
        b = mean_val + k * sd_val
        boundaries.append(b)
        transformed_boundaries_info.append({
            "grade": grade,
            "k": k,
            "boundary": round(b, 6)
        })

    # Step 4: Apply inverse Box-Cox to get final boundaries in original marks
    final_boundaries = [inverse_boxcox(b, lam) for b in boundaries]

    # Format final grade ranges
    # O: final_boundaries[0] to 100
    # A+: final_boundaries[1] to below final_boundaries[0]
    # A: final_boundaries[2] to below final_boundaries[1]
    # B+: final_boundaries[3] to below final_boundaries[2]
    # B: final_boundaries[4] to below final_boundaries[3]
    # C: 45 to below final_boundaries[4]
    grade_ranges = []
    for i, grade in enumerate(GRADES):
        point = POINTS[grade]
        if i == 0:
            min_mark = final_boundaries[0]
            max_mark = MAX_MARK
            range_str = f"{min_mark:.2f} to 100"
            rule_str = f">= {min_mark:.2f}"
        elif i == len(GRADES) - 1:
            min_mark = PASS_MARK
            max_mark = final_boundaries[-1]
            range_str = f"{PASS_MARK:.2f} to below {final_boundaries[-1]:.2f}"
            rule_str = f"{PASS_MARK:.2f} <= mark < {final_boundaries[-1]:.2f}"
        else:
            min_mark = final_boundaries[i]
            max_mark = final_boundaries[i - 1]
            range_str = f"{min_mark:.2f} to below {max_mark:.2f}"
            rule_str = f"{min_mark:.2f} <= mark < {max_mark:.2f}"

        grade_ranges.append({
            "grade": grade,
            "points": point,
            "range": range_str,
            "rule": rule_str,
            "minMark": round(min_mark, 2),
            "maxMark": round(max_mark, 2)
        })

    # Step 5: Assign grades to each gradable student
    def get_grade(mark_val: float) -> str:
        for idx, b in enumerate(final_boundaries):
            if mark_val >= b:
                return GRADES[idx]
        return "C"

    # Map student transformed scores and grades
    student_results = []
    grade_distribution = {g: 0 for g in GRADES}
    grade_distribution["U"] = 0  # Add U to distribution

    # First: process gradable students
    for idx, s in enumerate(gradable_students):
        orig_m = float(marks[idx])
        trans_m = float(transformed[idx])
        assigned_grade = get_grade(orig_m)
        assigned_point = POINTS[assigned_grade]
        grade_distribution[assigned_grade] += 1

        student_results.append({
            "registerNumber": str(s.get("register_number", "")),
            "studentName": str(s.get("name", "")),
            "originalMark": round(orig_m, 2),
            "transformedScore": round(trans_m, 6),
            "grade": assigned_grade,
            "points": assigned_point,
            "isAbsent": False,
        })

    # Second: add U-grade students
    for s in u_students:
        raw_mark = s.get("mark")
        is_ab = s.get("reason") == "absent"
        if raw_mark is not None and not (isinstance(raw_mark, float) and np.isnan(raw_mark)):
            orig_m = float(raw_mark)
        else:
            orig_m = None
        grade_distribution["U"] += 1

        student_results.append({
            "registerNumber": str(s.get("register_number", "")),
            "studentName": str(s.get("name", "")),
            "originalMark": round(orig_m, 2) if orig_m is not None else None,
            "transformedScore": None,
            "grade": "U",
            "points": 0,
            "isAbsent": is_ab,
        })

    # Sort student results by register number
    student_results.sort(key=lambda item: natural_sort_key(item["registerNumber"]))

    # Step 6: Generate histograms (only for gradable students)
    hist_before = compute_histogram_bins(marks, num_bins=8)
    hist_after = compute_histogram_bins(transformed, num_bins=8)

    return {
        "subjectCode": subject_code,
        "totalStudents": n,          # Only gradable students used in Box-Cox
        "totalIncludingU": len(student_results),
        "uCount": grade_distribution["U"],
        "optimalLambda": round(lam, 6),
        "mean": round(mean_val, 6),
        "standardDeviation": round(sd_val, 6),
        "transformedBoundaries": transformed_boundaries_info,
        "finalBoundaries": [round(b, 4) for b in final_boundaries],
        "finalGradeRanges": grade_ranges,
        "gradeDistribution": grade_distribution,
        "studentResults": student_results,
        "histogramBefore": hist_before,
        "histogramAfter": hist_after,
        "originalMarks": [round(float(m), 2) for m in marks],
        "transformedScores": [round(float(t), 6) for t in transformed],
        "kValues": active_k,
    }


def parse_and_validate_excel(file_bytes: bytes) -> Tuple[List[str], List[Dict[str, Any]], List[str]]:
    """
    Parses the uploaded Excel workbook and validates:
    - Finds Student Register Number column
    - Finds Student Name column
    - Detects subject columns (all other columns)
    - Validates marks: numeric between 45 and 100 are accepted as passing.
      Marks < 45 or "AB" (absent) are flagged as U-grade (fail/absent) but NOT treated as errors.
    Returns: (subject_codes, parsed_student_rows, error_messages)
    """
    errors: List[str] = []

    try:
        df = pd.read_excel(io.BytesIO(file_bytes))
    except Exception as e:
        return [], [], [f"Unable to read Excel file: {str(e)}"]

    if df.empty:
        return [], [], ["The uploaded Excel file is empty."]

    # Strip whitespace from column names
    df.columns = [str(c).strip() for c in df.columns]

    # Find Register Number column
    reg_col = None
    for col in df.columns:
        c_clean = col.lower().replace(" ", "").replace("_", "").replace(".", "")
        if c_clean in ["studentregisternumber", "registernumber", "registerno", "regno", "register_number", "rollno", "rollnumber", "reg_no"]:
            reg_col = col
            break
    if not reg_col:
        # Check first column or partial match
        for col in df.columns:
            if "register" in col.lower() or "reg" in col.lower() or "roll" in col.lower():
                reg_col = col
                break

    # Find Name column
    name_col = None
    for col in df.columns:
        if col == reg_col:
            continue
        c_clean = col.lower().replace(" ", "").replace("_", "")
        if c_clean in ["studentname", "name", "student_name", "candidate_name"]:
            name_col = col
            break
    if not name_col:
        for col in df.columns:
            if col != reg_col and "name" in col.lower():
                name_col = col
                break

    if not reg_col:
        errors.append("Missing 'Student Register Number' column in Excel file.")
    if not name_col:
        errors.append("Missing 'Student Name' column in Excel file.")

    if errors:
        return [], [], errors

    # Subject columns are all remaining columns
    subject_cols = [c for c in df.columns if c not in [reg_col, name_col]]
    if not subject_cols:
        return [], [], ["No subject columns found in Excel. Expected at least one subject course code column."]

    student_rows = []

    for row_idx, row in df.iterrows():
        excel_row_num = row_idx + 2  # 1-indexed, accounting for header
        reg_num = str(row[reg_col]).strip() if pd.notna(row[reg_col]) else ""
        s_name = str(row[name_col]).strip() if pd.notna(row[name_col]) else ""

        if not reg_num and not s_name:
            # Skip empty trailing rows
            continue

        if not reg_num:
            errors.append(f"Row {excel_row_num}: Student Register Number is empty.")
        if not s_name:
            errors.append(f"Row {excel_row_num}: Student Name is empty for Register No '{reg_num}'.")

        row_marks: Dict[str, Any] = {}
        for subj in subject_cols:
            val = row[subj]

            # Check for absent marker (AB / ABSENT / A/B)
            if not pd.isna(val) and _is_absent_value(val):
                # Mark as absent (U grade)
                row_marks[subj] = {"mark": None, "isAbsent": True}
                continue

            if pd.isna(val) or val == "" or str(val).strip().lower() in ["na", "n/a", "none", "-"]:
                # Mark is missing / empty - treat as not attempted (skipped for this subject)
                row_marks[subj] = None
            else:
                try:
                    num_val = float(val)
                    if num_val > MAX_MARK:
                        errors.append(
                            f"Row {excel_row_num} [{s_name} - {reg_num}], Subject '{subj}': Mark {num_val} exceeds maximum of {MAX_MARK:.0f}."
                        )
                        row_marks[subj] = None
                    elif num_val < PASS_MARK:
                        # Mark < 45: treat as fail (U grade), not an error
                        row_marks[subj] = {"mark": num_val, "isAbsent": False, "isFail": True}
                    else:
                        # Normal passing mark
                        row_marks[subj] = num_val
                except ValueError:
                    errors.append(
                        f"Row {excel_row_num} [{s_name} - {reg_num}], Subject '{subj}': Value '{val}' is not a valid numeric mark."
                    )

        student_rows.append({
            "register_number": reg_num,
            "name": s_name,
            "marks": row_marks
        })

    if not student_rows:
        errors.append("No student records found in the Excel sheet.")

    return subject_cols, student_rows, errors


def run_relative_grading_pipeline(
    subject_cols: List[str],
    student_rows: List[Dict[str, Any]],
    k_values: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Executes the Box-Cox grading pipeline across all subjects and constructs the final master grid.
    Students with marks < 45 or AB (absent) are assigned grade U and excluded from Box-Cox.
    """
    active_k = validate_k_values(k_values)
    subjects_output: Dict[str, Any] = {}

    # Process each subject
    for subj in subject_cols:
        subj_students = []
        for s in student_rows:
            mark_entry = s["marks"].get(subj)
            if mark_entry is None:
                # Student didn't take this subject — skip entirely
                continue
            if isinstance(mark_entry, dict):
                # Absent or fail entry
                subj_students.append({
                    "register_number": s["register_number"],
                    "name": s["name"],
                    "mark": mark_entry.get("mark"),
                    "isAbsent": mark_entry.get("isAbsent", False),
                    "isFail": mark_entry.get("isFail", False),
                })
            else:
                # Normal numeric mark
                subj_students.append({
                    "register_number": s["register_number"],
                    "name": s["name"],
                    "mark": mark_entry,
                    "isAbsent": False,
                    "isFail": False,
                })

        # Process subject grading
        try:
            subj_result = process_subject_grading(subj, subj_students, active_k)
            subjects_output[subj] = subj_result
        except Exception as e:
            raise ValueError(f"Error grading subject '{subj}': {str(e)}")

    # Build master grid:
    # Student Register Number, Student Name, Subject1 Grade, Subject2 Grade, ...
    grid_rows = []
    for s in student_rows:
        reg = s["register_number"]
        name = s["name"]
        row_dict = {
            "registerNumber": reg,
            "studentName": name,
            "grades": {},
            "points": {},
            "originalMarks": {}
        }
        for subj in subject_cols:
            mark_entry = s["marks"].get(subj)
            if mark_entry is None:
                row_dict["grades"][subj] = "-"
                row_dict["points"][subj] = None
                row_dict["originalMarks"][subj] = None
            elif isinstance(mark_entry, dict):
                # Absent or fail: assign U
                row_dict["grades"][subj] = "U"
                row_dict["points"][subj] = 0
                raw = mark_entry.get("mark")
                row_dict["originalMarks"][subj] = round(float(raw), 2) if raw is not None else None
                row_dict["isAbsent"] = row_dict.get("isAbsent", {})
                # Track per-subject absent status
                if not isinstance(row_dict.get("isAbsentMap"), dict):
                    row_dict["isAbsentMap"] = {}
                row_dict["isAbsentMap"][subj] = mark_entry.get("isAbsent", False)
            else:
                # Find assigned grade from subject result
                subj_res = subjects_output[subj]
                assigned_grade = "C"
                for b_idx, b_val in enumerate(subj_res["finalBoundaries"]):
                    if mark_entry >= b_val:
                        assigned_grade = GRADES[b_idx]
                        break
                row_dict["grades"][subj] = assigned_grade
                row_dict["points"][subj] = POINTS[assigned_grade]
                row_dict["originalMarks"][subj] = round(float(mark_entry), 2)

        grid_rows.append(row_dict)

    # Sort master grid rows by register number
    grid_rows.sort(key=lambda r: natural_sort_key(r["registerNumber"]))

    return {
        "subjects": subjects_output,
        "subjectCodes": subject_cols,
        "masterGrid": grid_rows,
        "totalStudents": len(student_rows),
        "studentRows": student_rows,
        "kValues": active_k,
    }


def export_grid_to_excel(subject_codes: List[str], grid_rows: List[Dict[str, Any]]) -> bytes:
    """
    Exports ONLY the master grid:
    Student Register Number, Student Name, followed by each Subject Letter Grade.
    """
    data = []
    for row in grid_rows:
        entry = {
            "Student Register Number": row["registerNumber"],
            "Student Name": row["studentName"]
        }
        for subj in subject_codes:
            entry[subj] = row["grades"].get(subj, "-")
        data.append(entry)

    df_out = pd.DataFrame(data)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df_out.to_excel(writer, index=False, sheet_name="Relative Grades")
    return output.getvalue()


def generate_sample_excel() -> bytes:
    """
    Generates a realistic sample Excel file with 25 students and 3 subjects (e.g. CS301, CS302, CS303)
    with marks strictly between 45 and 100 for immediate testing.
    Includes a few rows with marks < 45 and AB to demonstrate U-grade handling.
    """
    sample_students = [
        ("REG2024001", "Aarav Sharma", 88.5, 92.0, 74.0),
        ("REG2024002", "Diya Patel", 94.0, 89.0, 91.5),
        ("REG2024003", "Rohan Verma", 65.0, 71.5, 58.0),
        ("REG2024004", "Ananya Iyer", 78.0, 85.0, 82.0),
        ("REG2024005", "Vikram Singh", 52.0, 60.0, 49.5),
        ("REG2024006", "Sneha Nair", 81.5, 78.0, 86.0),
        ("REG2024007", "Karthik Raja", 70.0, 68.5, 73.0),
        ("REG2024008", "Pooja Reddy", 85.0, 90.0, 79.5),
        ("REG2024009", "Manoj Kumar", 59.0, 63.0, 66.0),
        ("REG2024010", "Priya Sundaram", 96.0, 95.0, 93.0),
        ("REG2024011", "Rahul Das", 47.5, 55.0, 46.0),
        ("REG2024012", "Meera Joshi", 83.0, 87.0, 85.0),
        ("REG2024013", "Siddharth Rao", 74.5, 76.0, 71.0),
        ("REG2024014", "Kavya Menon", 89.0, 88.0, 90.0),
        ("REG2024015", "Arjun Pillai", 62.0, 69.0, 64.0),
        ("REG2024016", "Divya Krishnan", 91.0, 84.5, 88.0),
        ("REG2024017", "Gautam Bhatt", 55.0, 58.0, 52.0),
        ("REG2024018", "Nandini Gupta", 79.0, 82.0, 77.0),
        ("REG2024019", "Varun Chopra", 68.0, 73.0, 69.5),
        ("REG2024020", "Ishaan Malhotra", 98.0, 96.5, 95.0),
        ("REG2024021", "Tanvi Sengupta", 72.0, 79.0, 75.0),
        ("REG2024022", "Aditya Deshmukh", 50.0, 53.5, 48.0),
        ("REG2024023", "Rhea Kapoor", 86.0, 91.0, 89.0),
        ("REG2024024", "Harish Nambiar", 64.0, 66.0, 61.5),
        ("REG2024025", "Swati Mukherjee", 77.0, 80.5, 83.0),
    ]

    rows = []
    for reg, name, m1, m2, m3 in sample_students:
        rows.append({
            "Student Register Number": reg,
            "Student Name": name,
            "CS301": m1,
            "CS302": m2,
            "CS303": m3
        })

    # Add two special rows: one with mark < 45 and one with AB
    rows.append({
        "Student Register Number": "REG2024026",
        "Student Name": "Fail Student",
        "CS301": 38.0,   # < 45: will get U
        "CS302": 55.0,
        "CS303": 42.0    # < 45: will get U
    })
    rows.append({
        "Student Register Number": "REG2024027",
        "Student Name": "Absent Student",
        "CS301": "AB",   # Absent: will get U
        "CS302": 60.0,
        "CS303": "AB"    # Absent: will get U
    })

    df_sample = pd.DataFrame(rows)

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df_sample.to_excel(writer, index=False, sheet_name="Students_Marks")
    return output.getvalue()
