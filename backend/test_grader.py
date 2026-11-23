import numpy as np
from scipy.stats import boxcox
from relative_grader import (
    process_subject_grading,
    parse_and_validate_excel,
    generate_sample_excel,
    export_grid_to_excel,
    run_relative_grading_pipeline,
    validate_k_values,
    DEFAULT_K_VALUES
)

def test_math_equivalence_with_new_defaults():
    # Test marks
    test_marks = [88.5, 94.0, 65.0, 78.0, 52.0, 81.5, 70.0, 85.0, 59.0, 96.0, 47.5, 83.0]
    
    # Run logic with new default boundaries: 1.5, 0.75, 0.0, -0.75, -2.0
    marks_arr = np.array(test_marks)
    transformed_orig, lam_orig = boxcox(marks_arr)
    mean_orig = np.mean(transformed_orig)
    sd_orig = np.std(transformed_orig, ddof=0)
    
    K = {"O": 1.5, "A+": 0.75, "A": 0.0, "B+": -0.75, "B": -2.0}
    GRADES = ["O", "A+", "A", "B+", "B", "C"]
    
    boundaries_orig = [mean_orig + K[g] * sd_orig for g in GRADES[:-1]]
    
    def inv_bc(y, l):
        if abs(l) < 1e-8:
            return np.exp(y)
        return (1 + l * y) ** (1 / l)
        
    final_boundaries_orig = [inv_bc(b, lam_orig) for b in boundaries_orig]
    
    student_records = [
        {"register_number": f"REG{i+1:03d}", "name": f"Student {i+1}", "mark": m}
        for i, m in enumerate(test_marks)
    ]
    res = process_subject_grading("CS101", student_records, k_values=K)
    
    # Assert
    assert abs(res["optimalLambda"] - lam_orig) < 1e-5
    assert abs(res["mean"] - mean_orig) < 1e-5
    assert abs(res["standardDeviation"] - sd_orig) < 1e-5
    
    for b_mod, b_orig in zip(res["finalBoundaries"], final_boundaries_orig):
        assert abs(b_mod - b_orig) < 1e-3, f"Boundary mismatch: {b_mod} vs {b_orig}"
        
    print("New default boundaries (1.5, 0.75, 0.0, -0.75, -2.0) verification PASSED!")

def test_custom_user_boundaries():
    # Test that user can set completely custom boundaries
    custom_k = {"O": 2.0, "A+": 1.2, "A": 0.3, "B+": -0.5, "B": -1.5}
    validated = validate_k_values(custom_k)
    assert validated["O"] == 2.0
    assert validated["B"] == -1.5

    # Test invalid non-descending boundaries
    try:
        validate_k_values({"O": 1.0, "A+": 1.5, "A": 0.0, "B+": -0.5, "B": -1.0})
        assert False, "Should have raised ValueError for non-descending order"
    except ValueError as e:
        print("Caught expected validation error for non-descending boundaries:", e)

def test_excel_pipeline():
    sample_bytes = generate_sample_excel()
    subj_cols, students, errors = parse_and_validate_excel(sample_bytes)
    assert len(errors) == 0, f"Unexpected errors: {errors}"
    assert len(subj_cols) == 3
    assert len(students) == 25
    
    pipeline_res = run_relative_grading_pipeline(subj_cols, students)
    assert len(pipeline_res["masterGrid"]) == 25
    assert "CS301" in pipeline_res["subjects"]
    assert "studentRows" in pipeline_res
    assert pipeline_res["kValues"]["A+"] == 0.75
    
    excel_bytes = export_grid_to_excel(subj_cols, pipeline_res["masterGrid"])
    assert len(excel_bytes) > 0
    print("Excel pipeline verification PASSED!")

if __name__ == "__main__":
    test_math_equivalence_with_new_defaults()
    test_custom_user_boundaries()
    test_excel_pipeline()
