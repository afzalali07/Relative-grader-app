import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, Download, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

export default function FileUpload({ onFileUpload, isLoading, onSampleLoad }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndProcess(file);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndProcess(file);
    }
  };

  const validateAndProcess = (file) => {
    const validExtensions = ['.xlsx', '.xls'];
    const hasValidExt = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      alert('Please upload an Excel file (.xlsx or .xls)');
      return;
    }
    onFileUpload(file);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Hero Intro */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          Statistical Normalization & Grading Engine
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Box-Cox Relative Grading System
        </h2>
        <p className="mt-3 text-base text-slate-600 max-w-2xl mx-auto">
          Upload your student mark sheet. The system validates marks (45–100), applies Box-Cox power transformation, computes statistical cutoffs, and generates the final Master Letter Grade Grid.
        </p>
      </div>

      {/* Upload Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        className={`relative group cursor-pointer border-2 border-dashed rounded-3xl p-10 transition-all duration-200 text-center bg-white shadow-xl shadow-slate-200/50 ${
          isDragOver
            ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
            : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/50'
        } ${isLoading ? 'opacity-70 pointer-events-none' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx, .xls"
          onChange={handleFileChange}
          className="hidden"
          disabled={isLoading}
        />

        <div className="flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 group-hover:bg-indigo-100 transition-all shadow-inner mb-4">
            {isLoading ? (
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <UploadCloud className="w-10 h-10" />
            )}
          </div>

          <h3 className="text-xl font-bold text-slate-800 mb-1">
            {isLoading ? 'Processing & Normalizing Marks...' : 'Upload Student Marks Excel File'}
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            Drag and drop your spreadsheet here, or <span className="text-indigo-600 font-semibold underline underline-offset-2">browse files</span> from your computer.
          </p>

          {/* Guidelines tags */}
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-xl mx-auto mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              .xlsx or .xls
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Marks: 45 to 100
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              N Course Code Columns
            </span>
          </div>

          {/* Quick actions inside upload card */}
          <div className="flex items-center gap-3 pt-4 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
            <a
              href="/api/sample-excel"
              download="relative_grading_sample.xlsx"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Download Excel Template
            </a>
            <button
              type="button"
              onClick={onSampleLoad}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Load Sample Demo Data (25 Students)
            </button>
          </div>
        </div>
      </div>

      {/* Excel Schema Guide */}
      <div className="mt-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          Expected Excel Format
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="py-2.5 px-4 font-semibold">Student Register Number</th>
                <th className="py-2.5 px-4 font-semibold">Student Name</th>
                <th className="py-2.5 px-4 font-semibold text-indigo-700 font-mono">CS301 (Course 1)</th>
                <th className="py-2.5 px-4 font-semibold text-indigo-700 font-mono">CS302 (Course 2)</th>
                <th className="py-2.5 px-4 font-semibold text-indigo-700 font-mono">... (Course N)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
              <tr>
                <td className="py-2 px-4">REG2024001</td>
                <td className="py-2 px-4 font-sans font-medium">Aarav Sharma</td>
                <td className="py-2 px-4">88.50</td>
                <td className="py-2 px-4">92.00</td>
                <td className="py-2 px-4">74.00</td>
              </tr>
              <tr>
                <td className="py-2 px-4">REG2024002</td>
                <td className="py-2 px-4 font-sans font-medium">Diya Patel</td>
                <td className="py-2 px-4">94.00</td>
                <td className="py-2 px-4">89.00</td>
                <td className="py-2 px-4">91.50</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] text-slate-500">
          * Note: Header names for register number (e.g. "Register Number", "Reg No", "Roll No") and name (e.g. "Student Name", "Name") are automatically detected. Any subsequent columns are treated as subject course codes.
        </p>
      </div>
    </div>
  );
}
