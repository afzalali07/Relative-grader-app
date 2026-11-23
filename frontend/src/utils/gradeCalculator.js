// Box-Cox Inverse and Instant Dynamic Re-grading Engine

export const GRADES = ['O', 'A+', 'A', 'B+', 'B', 'C'];
export const POINTS = { 'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5 };
export const PASS_MARK = 45.0;
export const MAX_MARK = 100.0;

export function inverseBoxCox(y, lam) {
  if (Math.abs(lam) < 1e-8) {
    return Math.exp(y);
  }
  const base = 1.0 + lam * y;
  if (base <= 0) {
    return 0.0;
  }
  return Math.pow(base, 1.0 / lam);
}

/**
 * Instantly re-evaluates grade boundaries and re-assigns grades
 * for all subjects and the master grid based on the provided kValues.
 */
export function recalculateResultsWithK(currentData, kValues) {
  if (!currentData || !currentData.subjects) return currentData;

  const activeK = {
    'O': parseFloat(kValues['O']),
    'A+': parseFloat(kValues['A+']),
    'A': parseFloat(kValues['A']),
    'B+': parseFloat(kValues['B+']),
    'B': parseFloat(kValues['B']),
  };

  const updatedSubjects = {};

  // 1. Recalculate for each subject
  for (const subjectCode of currentData.subjectCodes) {
    const subj = currentData.subjects[subjectCode];
    if (!subj) continue;

    const mean = subj.mean;
    const sd = subj.standardDeviation;
    const lam = subj.optimalLambda;

    // Transformed boundaries: mean + K * sd
    const boundaries = [];
    const transformedBoundaries = [];
    for (const g of GRADES.slice(0, -1)) {
      const k = activeK[g];
      const b = mean + k * sd;
      boundaries.push(b);
      transformedBoundaries.push({
        grade: g,
        k: k,
        boundary: parseFloat(b.toFixed(6))
      });
    }

    // Inverse Box-Cox to get final boundaries in original marks
    const finalBoundaries = boundaries.map(b => inverseBoxCox(b, lam));

    // Final Grade Ranges
    const finalGradeRanges = [];
    for (let i = 0; i < GRADES.length; i++) {
      const grade = GRADES[i];
      const point = POINTS[grade];
      let minMark, maxMark, rangeStr, ruleStr;

      if (i === 0) {
        minMark = finalBoundaries[0];
        maxMark = MAX_MARK;
        rangeStr = `${minMark.toFixed(2)} to 100`;
        ruleStr = `>= ${minMark.toFixed(2)}`;
      } else if (i === GRADES.length - 1) {
        minMark = PASS_MARK;
        maxMark = finalBoundaries[finalBoundaries.length - 1];
        rangeStr = `${PASS_MARK.toFixed(2)} to below ${maxMark.toFixed(2)}`;
        ruleStr = `${PASS_MARK.toFixed(2)} <= mark < ${maxMark.toFixed(2)}`;
      } else {
        minMark = finalBoundaries[i];
        maxMark = finalBoundaries[i - 1];
        rangeStr = `${minMark.toFixed(2)} to below ${maxMark.toFixed(2)}`;
        ruleStr = `${minMark.toFixed(2)} <= mark < ${maxMark.toFixed(2)}`;
      }

      finalGradeRanges.push({
        grade,
        points: point,
        range: rangeStr,
        rule: ruleStr,
        minMark: parseFloat(minMark.toFixed(2)),
        maxMark: parseFloat(maxMark.toFixed(2))
      });
    }

    // Helper to determine grade for a given mark
    const getGradeForMark = (mark) => {
      for (let idx = 0; idx < finalBoundaries.length; idx++) {
        if (mark >= finalBoundaries[idx]) {
          return GRADES[idx];
        }
      }
      return 'C';
    };

    // Re-grade students in this subject
    const gradeDistribution = { 'O': 0, 'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C': 0 };
    const updatedStudentResults = subj.studentResults.map(st => {
      const assignedGrade = getGradeForMark(st.originalMark);
      const assignedPoint = POINTS[assignedGrade];
      gradeDistribution[assignedGrade] = (gradeDistribution[assignedGrade] || 0) + 1;

      return {
        ...st,
        grade: assignedGrade,
        points: assignedPoint
      };
    });

    updatedSubjects[subjectCode] = {
      ...subj,
      kValues: activeK,
      transformedBoundaries,
      finalBoundaries: finalBoundaries.map(b => parseFloat(b.toFixed(4))),
      finalGradeRanges,
      gradeDistribution,
      studentResults: updatedStudentResults
    };
  }

  // 2. Re-calculate Master Grid letter grades
  const updatedMasterGrid = currentData.masterGrid.map(row => {
    const newGrades = { ...row.grades };
    const newPoints = { ...row.points };

    for (const code of currentData.subjectCodes) {
      const rawMark = row.originalMarks ? row.originalMarks[code] : undefined;
      if (rawMark !== undefined && rawMark !== null) {
        const subjData = updatedSubjects[code];
        let assigned = 'C';
        for (let idx = 0; idx < subjData.finalBoundaries.length; idx++) {
          if (rawMark >= subjData.finalBoundaries[idx]) {
            assigned = GRADES[idx];
            break;
          }
        }
        newGrades[code] = assigned;
        newPoints[code] = POINTS[assigned];
      }
    }

    return {
      ...row,
      grades: newGrades,
      points: newPoints
    };
  });

  return {
    ...currentData,
    kValues: activeK,
    subjects: updatedSubjects,
    masterGrid: updatedMasterGrid
  };
}
