import React, { useState } from 'react';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import SubjectDetails from './components/SubjectDetails';
import MasterGrid from './components/MasterGrid';
import FormulaModal from './components/FormulaModal';
import ValidationErrorsModal from './components/ValidationErrorsModal';
import {
  FileSpreadsheet,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Layers,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export default function App() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('masterGrid'); // 'masterGrid' or subjectCode
  const [validationErrors, setValidationErrors] = useState([]);
  const [errorFilename, setErrorFilename] = useState('');
  const [isFormulaOpen, setIsFormulaOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Upload and process Excel file
  const handleFileUpload = async (file) => {
    setIsLoading(true);
    setValidationErrors([]);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/grade/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        setValidationErrors(result.errors || ['An error occurred while validating the file.']);
        setErrorFilename(file.name);
        setData(null);
      } else {
        setData(result.data);
        setActiveTab('masterGrid');
      }
    } catch (err) {
      setValidationErrors([`Server connection error: ${err.message}`]);
      setErrorFilename(file.name);
    } finally {
      setIsLoading(false);
    }
  };

  // Load sample demo data directly
  const handleSampleLoad = async () => {
    setIsLoading(true);
    setValidationErrors([]);

    try {
      const sampleRes = await fetch('/api/sample-excel');
      const blob = await sampleRes.blob();
      const sampleFile = new File([blob], 'sample_student_marks.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      await handleFileUpload(sampleFile);
    } catch (err) {
      setValidationErrors([`Failed to load sample dataset: ${err.message}`]);
      setErrorFilename('sample_student_marks.xlsx');
      setIsLoading(false);
    }
  };

  // Export Master Grid to Excel
  const handleExportGrid = async () => {
    if (!data) return;
    setIsExporting(true);

    try {
      const res = await fetch('/api/grade/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectCodes: data.subjectCodes,
          masterGrid: data.masterGrid,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate export file.');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'relative_grading_master_grid.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(`Export error: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleReset = () => {
    setData(null);
    setActiveTab('masterGrid');
    setValidationErrors([]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Top Navbar */}
      <Header
        onOpenFormula={() => setIsFormulaOpen(true)}
        onReset={handleReset}
        hasData={!!data}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!data ? (
          <FileUpload
            onFileUpload={handleFileUpload}
            isLoading={isLoading}
            onSampleLoad={handleSampleLoad}
          />
        ) : (
          <div className="space-y-6">
            {/* Subject and Master Grid Navigation Tabs */}
            <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-sm flex flex-wrap items-center gap-1.5 overflow-x-auto">
              <button
                onClick={() => setActiveTab('masterGrid')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
                  activeTab === 'masterGrid'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Final Master Grid</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                  activeTab === 'masterGrid' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {data.masterGrid.length}
                </span>
              </button>

              <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

              {/* Subject Tabs */}
              {data.subjectCodes.map((code) => {
                const subjInfo = data.subjects[code];
                const isActive = activeTab === code;
                return (
                  <button
                    key={code}
                    onClick={() => setActiveTab(code)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span className="font-mono">{code}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                        isActive ? 'bg-slate-800 text-indigo-300' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      λ={subjInfo.optimalLambda.toFixed(2)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active View Container */}
            {activeTab === 'masterGrid' ? (
              <MasterGrid
                subjectCodes={data.subjectCodes}
                masterGrid={data.masterGrid}
                onExport={handleExportGrid}
                isExporting={isExporting}
              />
            ) : (
              <SubjectDetails subjectData={data.subjects[activeTab]} />
            )}
          </div>
        )}
      </main>

      {/* Formula & Explanation Modal */}
      <FormulaModal
        isOpen={isFormulaOpen}
        onClose={() => setIsFormulaOpen(false)}
      />

      {/* Excel Validation Errors Modal */}
      <ValidationErrorsModal
        errors={validationErrors}
        filename={errorFilename}
        onClose={() => setValidationErrors([])}
        onRetry={() => setValidationErrors([])}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Relative Grading Web Application &bull; Box-Cox Normalization Engine</span>
          <span className="text-slate-400">
            Grading Scale: O (10) &bull; A+ (9) &bull; A (8) &bull; B+ (7) &bull; B (6) &bull; C (5)
          </span>
        </div>
      </footer>
    </div>
  );
}
