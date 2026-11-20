import math
import re
from typing import Dict, List, Any, Optional, Tuple
import numpy as np
import pandas as pd
from scipy.stats import boxcox
import io

K_VALUES = {
    "O": 1.5,
    "A+": 1.0,
    "A": 0.5,
    "B+": 0.0,
    "B": -0.5,
}

GRADES = ["O", "A+", "A", "B+", "B", "C"]
POINTS = {"O": 10, "A+": 9, "A": 8, "B+": 7, "B": 6, "C": 5}
PASS_MARK = 45.0
MAX_MARK = 100.0


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


def process_subject_grading(
    subject_code: str,
    student_records: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Performs Box-Cox relative grading for a single subject.
    student_records is a list of dicts: {'register_number', 'name', 'mark'}
    """
    valid_students = [
        s for s in student_records
        if s.get("mark") is not None and not (isinstance(s["mark"], float) and np.isnan(s["mark"]))
    ]

    n = len(valid_students)
    if n < 2:
        raise ValueError(
            f"Subject '{subject_code}' has only {n} valid student mark(s). At least 2 students are required for Box-Cox transformation."
        )

    marks = np.array([float(s["mark"]) for s in valid_students], dtype=float)

    # Check variation
    if np.all(marks == marks[0]):
        raise ValueError(
            f"Subject '{subject_code}' all students have identical marks ({marks[0]}). Variance must be non-zero for Box-Cox transformation."
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
        k = K_VALUES[grade]
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

    # Step 5: Assign grades to each student
    def get_grade(mark_val: float) -> str:
        for idx, b in enumerate(final_boundaries):
            if mark_val >= b:
                return GRADES[idx]
        return "C"

    # Map student transformed scores and grades
    student_results = []
    grade_distribution = {g: 0 for g in GRADES}

    for idx, s in enumerate(valid_students):
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
            "points": assigned_point
        })

    # Sort student results by register number
    student_results.sort(key=lambda item: natural_sort_key(item["registerNumber"]))

    # Step 6: Generate histograms
    hist_before = compute_histogram_bins(marks, num_bins=8)
    hist_after = compute_histogram_bins(transformed, num_bins=8)

    return {
        "subjectCode": subject_code,
        "totalStudents": n,
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
    }


def parse_and_validate_excel(file_bytes: bytes) -> Tuple[List[str], List[Dict[str, Any]], List[str]]:
    """
    Parses the uploaded Excel workbook and validates:
    - Finds Student Register Number column
    - Finds Student Name column
    - Detects subject columns (all other columns)
    - Validates marks are numeric and between 45 and 100
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

        row_marks: Dict[str, Optional[float]] = {}
        for subj in subject_cols:
            val = row[subj]
            if pd.isna(val) or val == "" or str(val).strip().lower() in ["na", "n/a", "none", "-"]:
                # Mark is missing / empty
                row_marks[subj] = None
            else:
                try:
                    num_val = float(val)
                    if num_val < PASS_MARK or num_val > MAX_MARK:
                        errors.append(
                            f"Row {excel_row_num} [{s_name} - {reg_num}], Subject '{subj}': Mark {num_val} is invalid. Only passed marks between {PASS_MARK:.0f} and {MAX_MARK:.0f} are accepted."
                        )
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


def run_relative_grading_pipeline(subject_cols: List[str], student_rows: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Executes the Box-Cox grading pipeline across all subjects and constructs the final master grid.
    """
    subjects_output: Dict[str, Any] = {}
    
    # Process each subject
    for subj in subject_cols:
        subj_students = []
        for s in student_rows:
            mark = s["marks"].get(subj)
            if mark is not None:
                subj_students.append({
                    "register_number": s["register_number"],
                    "name": s["name"],
                    "mark": mark
                })

        # Process subject grading
        try:
            subj_result = process_subject_grading(subj, subj_students)
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
            mark = s["marks"].get(subj)
            if mark is None:
                row_dict["grades"][subj] = "-"
                row_dict["points"][subj] = None
                row_dict["originalMarks"][subj] = None
            else:
                # Find assigned grade from subject result
                subj_res = subjects_output[subj]
                assigned_grade = "C"
                for b_idx, b_val in enumerate(subj_res["finalBoundaries"]):
                    if mark >= b_val:
                        assigned_grade = GRADES[b_idx]
                        break
                row_dict["grades"][subj] = assigned_grade
                row_dict["points"][subj] = POINTS[assigned_grade]
                row_dict["originalMarks"][subj] = mark

        grid_rows.append(row_dict)

    # Sort master grid rows by register number
    grid_rows.sort(key=lambda r: natural_sort_key(r["registerNumber"]))

    return {
        "subjects": subjects_output,
        "subjectCodes": subject_cols,
        "masterGrid": grid_rows,
        "totalStudents": len(student_rows)
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

    df_sample = pd.DataFrame([
        {
            "Student Register Number": reg,
            "Student Name": name,
            "CS301": m1,
            "CS302": m2,
            "CS303": m3
        }
        for reg, name, m1, m2, m3 in sample_students
    ])

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df_sample.to_excel(writer, index=False, sheet_name="Students_Marks")
    return output.getvalue()
