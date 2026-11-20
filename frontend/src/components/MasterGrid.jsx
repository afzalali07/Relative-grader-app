import React, { useState, useMemo } from 'react';
import { Download, Search, Filter, FileSpreadsheet, Check, CheckCircle2, Award } from 'lucide-react';
import GradeBadge from './GradeBadge';

export default function MasterGrid({ subjectCodes, masterGrid, onExport, isExporting }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('grades'); // 'grades', 'withPoints', 'withMarks'

  // Filter students based on search and selected grade filter
  const filteredGrid = useMemo(() => {
    return masterGrid.filter((row) => {
      const matchesSearch =
        row.registerNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.studentName.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (gradeFilter === 'ALL') return true;

      // Check if student has the selected grade in any subject
      return Object.values(row.grades).includes(gradeFilter);
    });
  }, [masterGrid, searchTerm, gradeFilter]);

  // Overall grade statistics across all subjects
  const overallStats = useMemo(() => {
    const counts = { 'O': 0, 'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C': 0 };
    let totalGrades = 0;
    masterGrid.forEach((row) => {
      Object.values(row.grades).forEach((g) => {
        if (counts[g] !== undefined) {
          counts[g] += 1;
          totalGrades += 1;
        }
      });
    });
    return { counts, totalGrades };
  }, [masterGrid]);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              Master Relative Grading Grid
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Final Letter Grades across all {subjectCodes.length} subjects for {masterGrid.length} students. Ready for export.
          </p>
        </div>

        {/* Export Button */}
        <button
          onClick={onExport}
          disabled={isExporting}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50"
        >
          {isExporting ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span>Export Master Grid (.xlsx)</span>
        </button>
      </div>

      {/* Grade Distribution Overview Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {['O', 'A+', 'A', 'B+', 'B', 'C'].map((g) => {
          const count = overallStats.counts[g] || 0;
          const pct = overallStats.totalGrades > 0
            ? ((count / overallStats.totalGrades) * 100).toFixed(1)
            : '0.0';
          return (
            <button
              key={g}
              onClick={() => setGradeFilter(gradeFilter === g ? 'ALL' : g)}
              className={`p-3 rounded-xl border transition-all text-left flex flex-col justify-between ${
                gradeFilter === g
                  ? 'border-indigo-500 bg-indigo-50/70 shadow-sm ring-2 ring-indigo-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <GradeBadge grade={g} size="sm" />
                <span className="text-[10px] font-mono font-bold text-slate-400">{pct}%</span>
              </div>
              <div className="mt-2 text-base font-extrabold text-slate-800">
                {count} <span className="text-[11px] font-normal text-slate-400">grades</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Controls Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search register no or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs text-slate-500 font-medium">Display:</span>
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-xs">
              <button
                onClick={() => setViewMode('grades')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  viewMode === 'grades'
                    ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Letter Grades
              </button>
              <button
                onClick={() => setViewMode('withPoints')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  viewMode === 'withPoints'
                    ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                With Points
              </button>
              <button
                onClick={() => setViewMode('withMarks')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  viewMode === 'withMarks'
                    ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                With Raw Marks
              </button>
            </div>

            {gradeFilter !== 'ALL' && (
              <button
                onClick={() => setGradeFilter('ALL')}
                className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 rounded bg-rose-50 border border-rose-200"
              >
                Clear Filter ({gradeFilter})
              </button>
            )}
          </div>
        </div>

        {/* Master Grid Table */}
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 sticky top-0 z-10 shadow-sm backdrop-blur-sm">
              <tr>
                <th className="py-3 px-4 font-bold w-12 text-center">#</th>
                <th className="py-3 px-4 font-bold whitespace-nowrap">
                  Student Register Number
                </th>
                <th className="py-3 px-4 font-bold whitespace-nowrap min-w-[180px]">
                  Student Name
                </th>
                {subjectCodes.map((code) => (
                  <th
                    key={code}
                    className="py-3 px-4 font-bold text-center font-mono whitespace-nowrap text-indigo-900 bg-indigo-50/50 border-l border-slate-200"
                  >
                    {code}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGrid.length > 0 ? (
                filteredGrid.map((row, idx) => (
                  <tr key={row.registerNumber} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-4 text-center text-slate-400 font-mono">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                      {row.registerNumber}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-800 whitespace-nowrap">
                      {row.studentName}
                    </td>
                    {subjectCodes.map((code) => {
                      const grade = row.grades[code] || '-';
                      const points = row.points ? row.points[code] : undefined;
                      const rawMark = row.originalMarks ? row.originalMarks[code] : undefined;

                      return (
                        <td
                          key={code}
                          className="py-2.5 px-4 text-center border-l border-slate-100 whitespace-nowrap"
                        >
                          {viewMode === 'grades' && (
                            <GradeBadge grade={grade} size="sm" />
                          )}
                          {viewMode === 'withPoints' && (
                            <div className="inline-flex items-center gap-1.5">
                              <GradeBadge grade={grade} size="sm" />
                              {points !== undefined && points !== null && (
                                <span className="font-mono text-[11px] text-slate-500 font-bold">
                                  ({points})
                                </span>
                              )}
                            </div>
                          )}
                          {viewMode === 'withMarks' && (
                            <div className="flex flex-col items-center">
                              <GradeBadge grade={grade} size="sm" />
                              {rawMark !== undefined && rawMark !== null && (
                                <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                                  {rawMark.toFixed(1)} / 100
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={3 + subjectCodes.length}
                    className="py-12 text-center text-slate-400 text-xs"
                  >
                    No student records found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-700">{filteredGrid.length}</strong> of{' '}
            <strong className="text-slate-700">{masterGrid.length}</strong> students
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Grid ready for export as an Excel (.xlsx) file
          </span>
        </div>
      </div>
    </div>
  );
}
