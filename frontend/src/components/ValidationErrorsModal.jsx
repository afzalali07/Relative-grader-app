import React from 'react';
import { AlertTriangle, XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function ValidationErrorsModal({ errors, filename, onClose, onRetry }) {
  if (!errors || errors.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-rose-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-rose-100 bg-rose-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 text-rose-700 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-rose-900">Excel Validation Failed</h3>
              <p className="text-xs text-rose-600">
                Found {errors.length} issue{errors.length > 1 ? 's' : ''} in <span className="font-semibold">{filename}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 leading-relaxed">
            <span className="font-bold">Validation Rules:</span>
            <ul className="list-disc ml-5 mt-1 space-y-0.5">
              <li>Marks must be numeric and between <strong>45 and 100</strong> (only passed students).</li>
              <li>Columns must include <strong>Student Register Number</strong> and <strong>Student Name</strong>.</li>
              <li>Course codes should be column headers for all subsequent subject columns.</li>
              <li>At least 2 students with non-identical marks per subject are required for Box-Cox.</li>
            </ul>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 border-b border-slate-200">
              Detected Validation Issues ({errors.length})
            </div>
            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {errors.map((err, idx) => (
                <div key={idx} className="p-3 text-xs flex items-start gap-2.5 hover:bg-slate-50/50">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-100 text-rose-700 font-mono font-bold text-[10px] shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="font-mono text-slate-700 leading-snug">{err}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Please fix the highlighted rows in your Excel file and re-upload.
          </p>
          <div className="flex gap-2">
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Upload Corrected File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
