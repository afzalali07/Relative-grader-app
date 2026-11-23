import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Sigma,
  TrendingUp,
  Users,
  Search,
  ArrowUpDown,
  Layers,
  Award,
  CheckCircle2,
  Sliders,
  Filter,
  X
} from 'lucide-react';
import HistogramChart from './HistogramChart';
import GradeBadge from './GradeBadge';

export default function SubjectDetails({ subjectData }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('regAsc'); // 'regAsc', 'regDesc', 'markDesc', 'markAsc', 'nameAsc'

  const {
    subjectCode,
    totalStudents,
    optimalLambda,
    mean,
    standardDeviation,
    transformedBoundaries,
    finalBoundaries,
    finalGradeRanges,
    gradeDistribution,
    studentResults,
    histogramBefore,
    histogramAfter
  } = subjectData;

  // Filter and sort students for this subject
  const filteredStudents = useMemo(() => {
    return studentResults
      .filter((s) => {
        const query = searchTerm.toLowerCase();
        const matchesSearch =
          s.registerNumber.toLowerCase().includes(query) ||
          s.studentName.toLowerCase().includes(query);

        if (!matchesSearch) return false;

        if (selectedGradeFilter === 'ALL') return true;
        return s.grade === selectedGradeFilter;
      })
      .sort((a, b) => {
        if (sortBy === 'regAsc') return a.registerNumber.localeCompare(b.registerNumber, undefined, { numeric: true, sensitivity: 'base' });
        if (sortBy === 'regDesc') return b.registerNumber.localeCompare(a.registerNumber, undefined, { numeric: true, sensitivity: 'base' });
        if (sortBy === 'markDesc') return b.originalMark - a.originalMark;
        if (sortBy === 'markAsc') return a.originalMark - b.originalMark;
        if (sortBy === 'nameAsc') return a.studentName.localeCompare(b.studentName);
        return 0;
      });
  }, [studentResults, searchTerm, selectedGradeFilter, sortBy]);

  // Lambda explanation helper
  const getLambdaInterpretation = (lam) => {
    if (Math.abs(lam - 1.0) < 0.15) return 'Near Linear (Weak skewness)';
    if (Math.abs(lam - 0.5) < 0.15) return 'Square Root Transformation';
    if (Math.abs(lam) < 0.15) return 'Logarithmic Transformation (ln)';
    if (lam < 0) return 'Inverse Power Transformation';
    return 'Power Transformation';
  };

  return (
    <div className="space-y-6">
      {/* Subject Header & Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Lambda */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Optimal Lambda (λ)</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Sliders className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-indigo-600 font-mono">
            {optimalLambda.toFixed(6)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            {getLambdaInterpretation(optimalLambda)}
          </p>
        </div>

        {/* Mean */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Transformed Mean (μ)</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-800 font-mono">
            {mean.toFixed(6)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Normalized center distribution
          </p>
        </div>

        {/* Std Dev */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Std Deviation (σ)</span>
            <div className="p-2 bg-violet-50 text-violet-600 rounded-xl">
              <Sigma className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-800 font-mono">
            {standardDeviation.toFixed(6)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Transformed population dispersion (ddof=0)
          </p>
        </div>

        {/* Students Count */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Students Evaluated</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-800">
            {totalStudents}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> All cleared (≥ 45 marks)
          </p>
        </div>
      </div>

      {/* Subject-Wise Grade Counts & Distribution */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              Subject Grade Distribution & Counts ({subjectCode})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Grade count breakdown specifically for {subjectCode}. Click any grade to filter student records below.
            </p>
          </div>
          {selectedGradeFilter !== 'ALL' && (
            <button
              onClick={() => setSelectedGradeFilter('ALL')}
              className="self-start sm:self-auto text-xs font-semibold px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 flex items-center gap-1 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Clear Filter ({selectedGradeFilter})
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {['O', 'A+', 'A', 'B+', 'B', 'C'].map((g) => {
            const count = gradeDistribution[g] || 0;
            const pct = totalStudents > 0 ? ((count / totalStudents) * 100).toFixed(1) : '0.0';
            const isSelected = selectedGradeFilter === g;

            return (
              <button
                key={g}
                onClick={() => setSelectedGradeFilter(isSelected ? 'ALL' : g)}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/70 shadow-sm ring-2 ring-indigo-500/20'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-sm'
                }`}
                title={`Filter by Grade ${g} in ${subjectCode}`}
              >
                <div className="flex items-center justify-between">
                  <GradeBadge grade={g} size="sm" />
                  <span className="text-[11px] font-mono font-bold text-slate-500">{pct}%</span>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-extrabold text-slate-900">
                    {count}
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium">
                    {count === 1 ? 'student' : 'students'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grade Ranges & Transformed Cutoffs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Final Grade Ranges (Original Marks) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" />
                Final Grade Ranges (Original Marks out of 100)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Inverse Box-Cox mapped grade boundaries applied directly to raw student marks
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {finalGradeRanges.map((gr) => {
              const count = gradeDistribution[gr.grade] || 0;
              const percentage = ((count / totalStudents) * 100).toFixed(1);
              return (
                <div
                  key={gr.grade}
                  className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <GradeBadge grade={gr.grade} points={gr.points} showPoints={true} size="md" />
                    <span className="text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                      {count} <span className="text-[10px] text-slate-400 font-normal">({percentage}%)</span>
                    </span>
                  </div>

                  <div className="mt-2">
                    <div className="text-xs font-semibold text-slate-500">Qualifying Mark Range:</div>
                    <div className="text-sm font-mono font-bold text-slate-900 mt-0.5">
                      {gr.range}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Transformed Boundaries Table */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Layers className="w-4 h-4 text-violet-600" />
              <h3 className="text-base font-bold text-slate-800">Transformed Boundaries</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Normalized cutoffs on Box-Cox scale (μ + K·σ)
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-left">
                    <th className="pb-2 font-semibold">Grade</th>
                    <th className="pb-2 font-semibold">K Factor</th>
                    <th className="pb-2 font-semibold text-right font-mono">Transformed (y)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {transformedBoundaries.map((b) => (
                    <tr key={b.grade} className="hover:bg-slate-50/50">
                      <td className="py-2 font-sans font-bold">
                        <GradeBadge grade={b.grade} size="sm" />
                      </td>
                      <td className="py-2 text-slate-600 font-mono font-medium">
                        {b.k >= 0 ? `+${b.k}` : `${b.k}`} σ
                      </td>
                      <td className="py-2 text-right font-semibold text-slate-800">
                        {b.boundary.toFixed(6)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50/70">
                    <td className="py-2 font-sans font-medium text-slate-500">Grade C</td>
                    <td className="py-2 text-slate-400 italic">Remaining</td>
                    <td className="py-2 text-right text-slate-500 font-mono">&lt; Grade B</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 p-3 bg-violet-50/60 rounded-xl border border-violet-100 text-[11px] text-violet-900 leading-snug">
            <span className="font-semibold">Inverse Mapping:</span> Bound scores are mapped back to original marks using <code className="font-mono">x = (1 + λ·y)^(1/λ)</code>.
          </div>
        </div>
      </div>

      {/* Histograms Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HistogramChart
          title="Original Marks Distribution"
          subtitle="Before Box-Cox Normalization (Raw Scores)"
          data={histogramBefore}
          xLabel="Original Marks"
          yLabel="Frequency"
          barColor="#4f46e5"
          hoverColor="#4338ca"
          isTransformed={false}
        />
        <HistogramChart
          title="Box-Cox Transformed Distribution"
          subtitle="After Box-Cox Normalization (Standardized Scores)"
          data={histogramAfter}
          xLabel="Transformed Scores (y)"
          yLabel="Frequency"
          barColor="#8b5cf6"
          hoverColor="#7c3aed"
          isTransformed={true}
        />
      </div>

      {/* Student Scores & Transformed Values Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              Student Scores & Transformed Values
              {selectedGradeFilter !== 'ALL' && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                  Grade {selectedGradeFilter} only
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Individual transformation scores, assigned relative grades, and points for {subjectCode}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student or roll no..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-56"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700"
            >
              <option value="regAsc">Reg No (Ascending)</option>
              <option value="regDesc">Reg No (Descending)</option>
              <option value="markDesc">Marks (Highest first)</option>
              <option value="markAsc">Marks (Lowest first)</option>
              <option value="nameAsc">Student Name</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="py-3 px-4 font-semibold">#</th>
                <th className="py-3 px-4 font-semibold">Register Number</th>
                <th className="py-3 px-4 font-semibold">Student Name</th>
                <th className="py-3 px-4 font-semibold text-right">Original Mark</th>
                <th className="py-3 px-4 font-semibold text-right font-mono">Box-Cox Transformed</th>
                <th className="py-3 px-4 font-semibold text-center">Grade</th>
                <th className="py-3 px-4 font-semibold text-center">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((s, idx) => (
                  <tr key={s.registerNumber} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="py-2.5 px-4 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-2.5 px-4 font-mono font-semibold text-slate-800">
                      {s.registerNumber}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-700">{s.studentName}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                      {s.originalMark.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-600">
                      {s.transformedScore.toFixed(6)}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <GradeBadge grade={s.grade} size="sm" />
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono font-bold text-slate-700">
                      {s.points}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    No students match your search or grade filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
