import React from 'react';
import { X, BookOpen, CheckCircle, Calculator, Info } from 'lucide-react';

export default function FormulaModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Box-Cox Relative Grading Logic</h3>
              <p className="text-xs text-slate-500">Mathematical methodology and boundary calculations</p>
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
          {/* Step 1 */}
          <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
            <h4 className="font-semibold text-indigo-900 flex items-center gap-2 mb-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-xs font-bold">1</span>
              Box-Cox Power Transformation
            </h4>
            <p className="mb-2">
              Finds the optimal parameter <code className="bg-indigo-100 px-1.5 py-0.5 rounded text-indigo-800 font-mono font-semibold">λ (lambda)</code> to maximize log-likelihood and transform skewed original marks into a standard normal distribution:
            </p>
            <div className="p-3 bg-white rounded-lg border border-indigo-100 font-mono text-center text-xs text-indigo-950 shadow-sm">
              y(λ) = (x^λ - 1) / λ &nbsp; (if λ ≠ 0), &nbsp; or &nbsp; ln(x) &nbsp; (if λ = 0)
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="font-semibold text-slate-800 flex items-center gap-2 mb-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-700 text-white text-xs font-bold">2</span>
              Mean & Standard Deviation
            </h4>
            <p>
              Calculates the mean <code className="bg-slate-200 px-1.5 py-0.5 rounded font-mono">μ</code> and population standard deviation <code className="bg-slate-200 px-1.5 py-0.5 rounded font-mono">σ (ddof=0)</code> of the transformed scores.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
            <h4 className="font-semibold text-emerald-900 flex items-center gap-2 mb-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white text-xs font-bold">3</span>
              Transformed Grade Cutoffs (K Multipliers)
            </h4>
            <p className="mb-3">
              Grade cutoffs on normalized scores are evaluated using standard deviations from the mean: <code className="font-mono font-semibold">Boundary = μ + K · σ</code>
            </p>
            <div className="grid grid-cols-5 gap-2 text-center text-xs">
              <div className="p-2 bg-white rounded border border-emerald-200">
                <div className="font-bold text-amber-700">Grade O</div>
                <div className="font-mono text-slate-600">K = +1.5</div>
                <div className="text-[10px] text-slate-400">10 Pts</div>
              </div>
              <div className="p-2 bg-white rounded border border-emerald-200">
                <div className="font-bold text-emerald-700">Grade A+</div>
                <div className="font-mono text-slate-600">K = +1.0</div>
                <div className="text-[10px] text-slate-400">9 Pts</div>
              </div>
              <div className="p-2 bg-white rounded border border-emerald-200">
                <div className="font-bold text-teal-700">Grade A</div>
                <div className="font-mono text-slate-600">K = +0.5</div>
                <div className="text-[10px] text-slate-400">8 Pts</div>
              </div>
              <div className="p-2 bg-white rounded border border-emerald-200">
                <div className="font-bold text-blue-700">Grade B+</div>
                <div className="font-mono text-slate-600">K = 0.0</div>
                <div className="text-[10px] text-slate-400">7 Pts</div>
              </div>
              <div className="p-2 bg-white rounded border border-emerald-200">
                <div className="font-bold text-indigo-700">Grade B</div>
                <div className="font-mono text-slate-600">K = -0.5</div>
                <div className="text-[10px] text-slate-400">6 Pts</div>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500 italic">
              * Grade C (5 Pts) covers all passed students scoring below Grade B down to passing mark 45.
            </p>
          </div>

          {/* Step 4 & 5 */}
          <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100">
            <h4 className="font-semibold text-amber-900 flex items-center gap-2 mb-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-600 text-white text-xs font-bold">4</span>
              Inverse Box-Cox & Final Mark Ranges
            </h4>
            <p className="mb-2">
              Each boundary is mapped back to the original marks domain (out of 100):
            </p>
            <div className="p-3 bg-white rounded-lg border border-amber-100 font-mono text-center text-xs text-amber-950 shadow-sm mb-2">
              x = (1 + λ · y)^(1 / λ) &nbsp; (if λ ≠ 0), &nbsp; or &nbsp; exp(y) &nbsp; (if λ = 0)
            </div>
            <p className="text-xs text-slate-500">
              Students scoring at or above each boundary in original marks receive that grade.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
