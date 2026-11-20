# Relative Grading System (React & Python)

A modern, high-performance web application for **Statistical Relative Grading** using the **Box-Cox Power Transformation**.

Designed for colleges and universities to compute standardized letter grades (`O`, `A+`, `A`, `B+`, `B`, `C`) from raw marks across any number of subjects with complete statistical transparency and interactive visual distributions.

---

## 🌟 Key Features

1. **Multi-Subject Excel Import & Automatic Validation**:
   - Accepts `.xlsx` or `.xls` workbooks.
   - Detects `Student Register Number`, `Student Name`, followed by $N$ course code columns (e.g. `CS301`, `CS302`, `CS303`).
   - Validates that marks are numeric and between **45 and 100** (only passed marks).
   - Detailed error reports highlighting exact row indices and offending values for invalid records.

2. **Box-Cox Relative Grading Normalization**:
   - Computes optimal power parameter $\lambda$ using maximum likelihood estimation (`scipy.stats.boxcox`).
   - Transforms raw scores into normalized scores: $y^{(\lambda)} = \frac{x^\lambda - 1}{\lambda}$ (or $\ln(x)$ if $\lambda = 0$).
   - Calculates population mean ($\mu$) and standard deviation ($\sigma$, `ddof=0`).
   - Computes transformed cutoffs via standard deviation multipliers ($K$):
     - **O (10 Points)**: $\mu + 1.5 \cdot \sigma$
     - **A+ (9 Points)**: $\mu + 1.0 \cdot \sigma$
     - **A (8 Points)**: $\mu + 0.5 \cdot \sigma$
     - **B+ (7 Points)**: $\mu + 0.0 \cdot \sigma$
     - **B (6 Points)**: $\mu - 0.5 \cdot \sigma$
     - **C (5 Points)**: Remaining cleared students scoring down to 45
   - Inverses boundaries back to original mark ranges using $x = (1 + \lambda \cdot y)^{1/\lambda}$ (or $\exp(y)$ if $\lambda = 0$).

3. **Rich Subject Analysis UI**:
   - **Subject-Wise Grade Distribution & Counts**: Dedicated breakdown showing the exact number of students and percentages receiving each letter grade (`O`, `A+`, `A`, `B+`, `B`, `C`) for that individual subject, with interactive grade filtering.
   - **Optimal $\lambda$ Value** and mathematical interpretation.
   - **Mean ($\mu$)** and **Standard Deviation ($\sigma$)** cards.
   - **Transformed Grade Boundaries** and **Final Grade Ranges** (in raw marks).
   - **Dual Interactive Histograms**:
     - *Histogram 1*: Frequency vs. Original Marks (Before Normalization)
     - *Histogram 2*: Frequency vs. Transformed Marks (After Box-Cox Normalization)
   - Searchable, sortable student list with raw marks, transformed scores, and assigned grades.

4. **Master Grade Grid & Excel Export**:
   - Master Grid displaying: `Student Register Number`, `Student Name`, and the letter grade for every subject (without global aggregations).
   - Search by student register number or name.
   - Toggle display modes: Letter Grades (default), With Points, or With Raw Marks.
   - **One-click Excel Export**: Exports strictly the Master Grid (`Student Register Number`, `Student Name`, and subject Letter Grades) as `.xlsx`.

---

## 🚀 Quick Start Guide

### 1. Requirements
- Python 3.10+
- Node.js 18+ (for frontend modifications/rebuild)

### 2. Run the Application
Simply run the launcher script from the root directory:

```bash
python run.py
```

The app will start at **http://127.0.0.1:8000** and automatically open in your default web browser!

---

## 🛠️ Development Mode (Optional)

If you wish to run backend and frontend independently with hot-reloading:

### Backend:
```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

### Frontend:
```bash
cd frontend
npm run dev
```
Open **http://localhost:5173**. Vite proxies all `/api/*` requests to port `8000`.

---

## 📊 Sample Excel Format

A ready-to-test sample spreadsheet `sample_students_input.xlsx` is included in the project root. You can also download it directly from the UI navbar.

| Student Register Number | Student Name | CS301 | CS302 | CS303 |
| :--- | :--- | :---: | :---: | :---: |
| `REG2024001` | Aarav Sharma | 88.50 | 92.00 | 74.00 |
| `REG2024002` | Diya Patel | 94.00 | 89.00 | 91.50 |
| `REG2024003` | Rohan Verma | 65.00 | 71.50 | 58.00 |
| ... | ... | ... | ... | ... |

- **Passing mark threshold**: Marks must be $\ge 45$ and $\le 100$.

---

## 🧪 Testing

Run mathematical verification and API unit tests:

```bash
# Verify mathematical equivalence with user Box-Cox template
python backend/test_grader.py

# Verify FastAPI endpoints and validation logic
python backend/test_api.py
```
