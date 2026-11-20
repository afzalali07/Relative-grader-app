import numpy as np
from scipy.stats import boxcox
from relative_grader import process_subject_grading, parse_and_validate_excel, generate_sample_excel, export_grid_to_excel, run_relative_grading_pipeline

def test_math_equivalence_with_user_sample():
    # User sample test marks
    test_marks = [88.5, 94.0, 65.0, 78.0, 52.0, 81.5, 70.0, 85.0, 59.0, 96.0, 47.5, 83.0]
    
    # Run user logic directly
    marks_arr = np.array(test_marks)
    transformed_orig, lam_orig = boxcox(marks_arr)
    mean_orig = np.mean(transformed_orig)
    sd_orig = np.std(transformed_orig, ddof=0)
    
    K = {"O": 1.5, "A+": 1.0, "A": 0.5, "B+": 0.0, "B": -0.5}
    GRADES = ["O", "A+", "A", "B+", "B", "C"]
    
    boundaries_orig = [mean_orig + K[g] * sd_orig for g in GRADES[:-1]]
    
    def inv_bc(y, l):
        if abs(l) < 1e-8:
            return np.exp(y)
        return (1 + l * y) ** (1 / l)
        
    final_boundaries_orig = [inv_bc(b, lam_orig) for b in boundaries_orig]
    
    # Run our module
    student_records = [
        {"register_number": f"REG{i+1:03d}", "name": f"Student {i+1}", "mark": m}
        for i, m in enumerate(test_marks)
    ]
    res = process_subject_grading("CS101", student_records)
    
    # Assert
    assert abs(res["optimalLambda"] - lam_orig) < 1e-5, f"Lambda mismatch: {res['optimalLambda']} vs {lam_orig}"
    assert abs(res["mean"] - mean_orig) < 1e-5, f"Mean mismatch: {res['mean']} vs {mean_orig}"
    assert abs(res["standardDeviation"] - sd_orig) < 1e-5, f"SD mismatch: {res['standardDeviation']} vs {sd_orig}"
    
    for b_mod, b_orig in zip(res["finalBoundaries"], final_boundaries_orig):
        assert abs(b_mod - b_orig) < 1e-3, f"Boundary mismatch: {b_mod} vs {b_orig}"
        
    print("Mathematics verification PASSED perfectly!")

def test_excel_pipeline():
    sample_bytes = generate_sample_excel()
    subj_cols, students, errors = parse_and_validate_excel(sample_bytes)
    assert len(errors) == 0, f"Unexpected errors: {errors}"
    assert len(subj_cols) == 3
    assert len(students) == 25
    
    pipeline_res = run_relative_grading_pipeline(subj_cols, students)
    assert len(pipeline_res["masterGrid"]) == 25
    assert "CS301" in pipeline_res["subjects"]
    assert "CS302" in pipeline_res["subjects"]
    assert "CS303" in pipeline_res["subjects"]
    
    excel_bytes = export_grid_to_excel(subj_cols, pipeline_res["masterGrid"])
    assert len(excel_bytes) > 0
    print("Excel pipeline verification PASSED!")

if __name__ == "__main__":
    test_math_equivalence_with_user_sample()
    test_excel_pipeline()
