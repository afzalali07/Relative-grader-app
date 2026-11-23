import React, { useState, useEffect } from 'react';
import { X, Calculator, Sliders, RotateCcw, Check, AlertCircle, Sparkles, HelpCircle } from 'lucide-react';
import GradeBadge from './GradeBadge';

const DEFAULT_BOUNDARIES = {
  'O': 1.5,
  'A+': 0.75,
  'A': 0.0,
  'B+': -0.75,
  'B': -2.0,
};

export default function FormulaModal({ isOpen, onClose, activeKValues, onSaveKValues }) {
  const [kValues, setKValues] = useState(DEFAULT_BOUNDARIES);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sync with prop when opened
  useEffect(() => {
    if (activeKValues) {
      setKValues({
        'O': activeKValues['O'] !== undefined ? activeKValues['O'] : DEFAULT_BOUNDARIES['O'],
        'A+': activeKValues['A+'] !== undefined ? activeKValues['A+'] : DEFAULT_BOUNDARIES['A+'],
        'A': activeKValues['A'] !== undefined ? activeKValues['A'] : DEFAULT_BOUNDARIES['A'],
        'B+': activeKValues['B+'] !== undefined ? activeKValues['B+'] : DEFAULT_BOUNDARIES['B+'],
        'B': activeKValues['B'] !== undefined ? activeKValues['B'] : DEFAULT_BOUNDARIES['B'],
      });
    }
    setErrorMsg('');
    setSuccessMsg('');
  }, [isOpen, activeKValues]);

  if (!isOpen) return null;

  const handleInputChange = (grade, val) => {
    setSuccessMsg('');
    setErrorMsg('');
    setKValues(prev => ({
      ...prev,
      [grade]: val === '' ? '' : parseFloat(val) || val
    }));
  };

  const handleResetDefaults = () => {
    setKValues(DEFAULT_BOUNDARIES);
    setErrorMsg('');
    setSuccessMsg('Reset to default boundaries (1.5, 0.75, 0.0, -0.75, -2.0)');
  };

  const handleApplyAndFix = () => {
    setErrorMsg('');
    setSuccessMsg('');

    // Validate numbers
    const parsed = {
      'O': parseFloat(kValues['O']),
      'A+': parseFloat(kValues['A+']),
      'A': parseFloat(kValues['A']),
      'B+': parseFloat(kValues['B+']),
      'B': parseFloat(kValues['B']),
    };

    for (const [g, v] of Object.entries(parsed)) {
      if (isNaN(v)) {
        setErrorMsg(`Please enter a valid numeric multiplier for Grade ${g}.`);
        return;
      }
    }

    // Validate descending order
    if (parsed['O'] <= parsed['A+']) {
      setErrorMsg(`Grade O (${parsed['O']}) must be strictly greater than Grade A+ (${parsed['A+']}).`);
      return;
    }
    if (parsed['A+'] <= parsed['A']) {
      setErrorMsg(`Grade A+ (${parsed['A+']}) must be strictly greater than Grade A (${parsed['A']}).`);
      return;
    }
    if (parsed['A'] <= parsed['B+']) {
      setErrorMsg(`Grade A (${parsed['A']}) must be strictly greater than Grade B+ (${parsed['B+']}).`);
      return;
    }
    if (parsed['B+'] <= parsed['B']) {
      setErrorMsg(`Grade B+ (${parsed['B+']}) must be strictly greater than Grade B (${parsed['B']}).`);
      return;
    }

    onSaveKValues(parsed);
    setSuccessMsg('Boundaries successfully fixed & applied to grading calculations!');
    setTimeout(() => {
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Grading Logic & Grade Boundaries</h3>
              <p className="text-xs text-slate-500">Configure custom standard deviation cutoffs (K multipliers) or view formulas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-600">
          {/* Section 1: Manual Boundary Input */}
          <div className="p-5 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/40 rounded-2xl border border-indigo-200/80 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h4 className="font-bold text-slate-900 flex items-center gap-2 text-base">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  Custom Grade Boundaries (K Multipliers)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set the standard deviation factor (<code className="font-mono font-semibold">Boundary = μ + K · σ</code>) for each grade.
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1 font-medium px-2.5 py-1 rounded-md hover:bg-white border border-transparent hover:border-slate-200 transition-colors self-start sm:self-auto"
                title="Reset to recommended defaults (1.5, 0.75, 0.0, -0.75, -2.0)"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Defaults
              </button>
            </div>

            {/* Input grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
              {/* O */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-200/50 transition-all">
                <div className="flex items-center justify-between mb-1.5">
                  <GradeBadge grade="O" size="sm" />
                  <span className="text-[10px] text-slate-400 font-bold">10 pts</span>
                </div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  K Factor (O)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={kValues['O']}
                  onChange={(e) => handleInputChange('O', e.target.value)}
                  className="w-full font-mono font-bold text-slate-800 text-sm bg-slate-50 px-2 py-1 rounded border border-slate-200 focus:outline-none focus:bg-white"
                  placeholder="1.5"
                />
              </div>

              {/* A+ */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-200/50 transition-all">
                <div className="flex items-center justify-between mb-1.5">
                  <GradeBadge grade="A+" size="sm" />
                  <span className="text-[10px] text-slate-400 font-bold">9 pts</span>
                </div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  K Factor (A+)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={kValues['A+']}
                  onChange={(e) => handleInputChange('A+', e.target.value)}
                  className="w-full font-mono font-bold text-slate-800 text-sm bg-slate-50 px-2 py-1 rounded border border-slate-200 focus:outline-none focus:bg-white"
                  placeholder="0.75"
                />
              </div>

              {/* A */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-200/50 transition-all">
                <div className="flex items-center justify-between mb-1.5">
                  <GradeBadge grade="A" size="sm" />
                  <span className="text-[10px] text-slate-400 font-bold">8 pts</span>
                </div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  K Factor (A)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={kValues['A']}
                  onChange={(e) => handleInputChange('A', e.target.value)}
                  className="w-full font-mono font-bold text-slate-800 text-sm bg-slate-50 px-2 py-1 rounded border border-slate-200 focus:outline-none focus:bg-white"
                  placeholder="0.0"
                />
              </div>

              {/* B+ */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-200/50 transition-all">
                <div className="flex items-center justify-between mb-1.5">
                  <GradeBadge grade="B+" size="sm" />
                  <span className="text-[10px] text-slate-400 font-bold">7 pts</span>
                </div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  K Factor (B+)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={kValues['B+']}
                  onChange={(e) => handleInputChange('B+', e.target.value)}
                  className="w-full font-mono font-bold text-slate-800 text-sm bg-slate-50 px-2 py-1 rounded border border-slate-200 focus:outline-none focus:bg-white"
                  placeholder="-0.75"
                />
              </div>

              {/* B */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-200/50 transition-all">
                <div className="flex items-center justify-between mb-1.5">
                  <GradeBadge grade="B" size="sm" />
                  <span className="text-[10px] text-slate-400 font-bold">6 pts</span>
                </div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  K Factor (B)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={kValues['B']}
                  onChange={(e) => handleInputChange('B', e.target.value)}
                  className="w-full font-mono font-bold text-slate-800 text-sm bg-slate-50 px-2 py-1 rounded border border-slate-200 focus:outline-none focus:bg-white"
                  placeholder="-2.0"
                />
              </div>
            </div>

            {/* Grade C note */}
            <div className="mt-3 text-xs text-slate-500 flex items-center justify-between bg-white/70 p-2.5 rounded-lg border border-slate-200/60">
              <span className="flex items-center gap-2">
                <GradeBadge grade="C" size="sm" />
                <span>Covers all cleared students below Grade B down to passing mark <strong>45</strong> (5 pts).</span>
              </span>
              <span className="font-mono text-[11px] text-slate-400 hidden sm:inline">&lt; K(B)</span>
            </div>

            {/* Error or Success notification */}
            {errorMsg && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Save / Fix Button */}
            <div className="mt-4 flex items-center justify-between pt-3 border-t border-indigo-100">
              <span className="text-[11px] text-slate-500">
                Current order: <strong className="font-mono">{kValues['O']} &gt; {kValues['A+']} &gt; {kValues['A']} &gt; {kValues['B+']} &gt; {kValues['B']}</strong>
              </span>
              <button
                type="button"
                onClick={handleApplyAndFix}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Fix & Apply Boundaries
              </button>
            </div>
          </div>

          {/* Section 2: Mathematical Steps */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-indigo-600" />
              Box-Cox Normalization Methodology
            </h4>

            {/* Step 1 */}
            <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
              <h5 className="font-semibold text-indigo-900 flex items-center gap-2 mb-1.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-xs font-bold">1</span>
                Box-Cox Power Transformation
              </h5>
              <p className="mb-2 text-xs">
                Finds optimal parameter <code className="bg-indigo-100 px-1.5 py-0.5 rounded text-indigo-800 font-mono font-semibold">λ (lambda)</code> to maximize log-likelihood and transform skewed marks to a standard normal distribution:
              </p>
              <div className="p-2.5 bg-white rounded-lg border border-indigo-100 font-mono text-center text-xs text-indigo-950 shadow-xs">
                y(λ) = (x^λ - 1) / λ &nbsp; (if λ ≠ 0), &nbsp; or &nbsp; ln(x) &nbsp; (if λ = 0)
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h5 className="font-semibold text-slate-800 flex items-center gap-2 mb-1.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-700 text-white text-xs font-bold">2</span>
                Mean (μ) & Standard Deviation (σ)
              </h5>
              <p className="text-xs">
                Calculates the mean <code className="bg-slate-200 px-1.5 py-0.5 rounded font-mono">μ</code> and population standard deviation <code className="bg-slate-200 px-1.5 py-0.5 rounded font-mono">σ (ddof=0)</code> of the transformed scores.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
              <h5 className="font-semibold text-emerald-900 flex items-center gap-2 mb-1.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white text-xs font-bold">3</span>
                Transformed Grade Cutoffs (Active Multipliers)
              </h5>
              <p className="mb-2 text-xs">
                Cutoffs on the normalized curve are evaluated as standard deviation offsets: <code className="font-mono font-semibold">Boundary = μ + K · σ</code>
              </p>
              <div className="grid grid-cols-5 gap-2 text-center text-xs">
                <div className="p-2 bg-white rounded border border-emerald-200">
                  <div className="font-bold text-amber-700">Grade O</div>
                  <div className="font-mono text-slate-600 font-semibold">{kValues['O'] >= 0 ? `+${kValues['O']}` : kValues['O']} σ</div>
                  <div className="text-[10px] text-slate-400">10 Pts</div>
                </div>
                <div className="p-2 bg-white rounded border border-emerald-200">
                  <div className="font-bold text-emerald-700">Grade A+</div>
                  <div className="font-mono text-slate-600 font-semibold">{kValues['A+'] >= 0 ? `+${kValues['A+']}` : kValues['A+']} σ</div>
                  <div className="text-[10px] text-slate-400">9 Pts</div>
                </div>
                <div className="p-2 bg-white rounded border border-emerald-200">
                  <div className="font-bold text-teal-700">Grade A</div>
                  <div className="font-mono text-slate-600 font-semibold">{kValues['A'] >= 0 ? `+${kValues['A']}` : kValues['A']} σ</div>
                  <div className="text-[10px] text-slate-400">8 Pts</div>
                </div>
                <div className="p-2 bg-white rounded border border-emerald-200">
                  <div className="font-bold text-blue-700">Grade B+</div>
                  <div className="font-mono text-slate-600 font-semibold">{kValues['B+'] >= 0 ? `+${kValues['B+']}` : kValues['B+']} σ</div>
                  <div className="text-[10px] text-slate-400">7 Pts</div>
                </div>
                <div className="p-2 bg-white rounded border border-emerald-200">
                  <div className="font-bold text-indigo-700">Grade B</div>
                  <div className="font-mono text-slate-600 font-semibold">{kValues['B'] >= 0 ? `+${kValues['B']}` : kValues['B']} σ</div>
                  <div className="text-[10px] text-slate-400">6 Pts</div>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100">
              <h5 className="font-semibold text-amber-900 flex items-center gap-2 mb-1.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-600 text-white text-xs font-bold">4</span>
                Inverse Box-Cox & Final Raw Mark Boundaries
              </h5>
              <p className="mb-2 text-xs">
                Each cutoff boundary is mapped back to original marks domain (out of 100):
              </p>
              <div className="p-2.5 bg-white rounded-lg border border-amber-100 font-mono text-center text-xs text-amber-950 shadow-xs">
                x = (1 + λ · y)^(1 / λ) &nbsp; (if λ ≠ 0), &nbsp; or &nbsp; exp(y) &nbsp; (if λ = 0)
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Changes take effect immediately on current and future grading.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
