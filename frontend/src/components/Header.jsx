import React from 'react';
import { BarChart3, Download, HelpCircle, UploadCloud, RefreshCw } from 'lucide-react';

export default function Header({ onOpenFormula, onReset, hasData }) {
  const handleDownloadSample = () => {
    window.location.href = '/api/sample-excel';
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Relative Grading System
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md">
                Box-Cox
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Statistical Relative Grading for Higher Education
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenFormula}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/60 rounded-lg border border-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Grading Logic</span>
          </button>

          <button
            onClick={handleDownloadSample}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg border border-slate-200 flex items-center gap-1.5 transition-colors shadow-sm"
            title="Download ready-to-test Excel file with 25 students and 3 subjects"
          >
            <Download className="w-4 h-4 text-indigo-600" />
            <span>Sample Excel</span>
          </button>

          {hasData && (
            <button
              onClick={onReset}
              className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>New File</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
