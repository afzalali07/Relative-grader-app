import React, { useState, useEffect } from 'react';
import { Sliders, RotateCcw, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Zap, HelpCircle } from 'lucide-react';
import GradeBadge from './GradeBadge';

export default function BoundaryBar({ activeKValues, onUpdateKValues, onOpenLogicModal }) {
  const [localK, setLocalK] = useState(activeKValues);
  const [isExpanded, setIsExpanded] = useState(true);
  const [validationError, setValidationError] = useState('');
  const [justUpdated, setJustUpdated] = useState(false);

  useEffect(() => {
    setLocalK(activeKValues);
  }, [activeKValues]);

  // Attempt live recalculation
  const handleValueChange = (grade, rawVal) => {
    const updated = {
      ...localK,
      [grade]: rawVal === '' ? '' : (parseFloat(rawVal) !== undefined ? rawVal : '')
    };
    setLocalK(updated);

    // Validate numbers
    const parsed = {
      'O': parseFloat(updated['O']),
      'A+': parseFloat(updated['A+']),
      'A': parseFloat(updated['A']),
      'B+': parseFloat(updated['B+']),
      'B': parseFloat(updated['B']),
    };

    if (Object.values(parsed).some(v => isNaN(v))) {
      setValidationError('All multipliers must be valid numbers.');
      return;
    }

    // Check descending order
    if (parsed['O'] <= parsed['A+']) {
      setValidationError(`O (${parsed['O']}) must be > A+ (${parsed['A+']})`);
      return;
    }
    if (parsed['A+'] <= parsed['A']) {
      setValidationError(`A+ (${parsed['A+']}) must be > A (${parsed['A']})`);
      return;
    }
    if (parsed['A'] <= parsed['B+']) {
      setValidationError(`A (${parsed['A']}) must be > B+ (${parsed['B+']})`);
      return;
    }
    if (parsed['B+'] <= parsed['B']) {
      setValidationError(`B+ (${parsed['B+']}) must be > B (${parsed['B']})`);
      return;
    }

    setValidationError('');
    // Trigger immediate recalculation on the active results!
    onUpdateKValues(parsed);

    setJustUpdated(true);
    setTimeout(() => setJustUpdated(false), 1200);
  };

  const applyPreset = (presetK, label) => {
    setLocalK(presetK);
    setValidationError('');
    onUpdateKValues(presetK);
    setJustUpdated(true);
    setTimeout(() => setJustUpdated(false), 1200);
  };

  return (
    <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden transition-all">
      {/* Bar Header */}
      <div className="px-5 py-3.5 bg-gradient-to-r from-indigo-50/90 via-white to-purple-50/50 flex flex-wrap items-center justify-between gap-3 border-b border-indigo-100/60">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-xs">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                Live Grade Boundary Multipliers (K)
              </h3>
              {justUpdated && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full animate-pulse">
                  <Zap className="w-3 h-3 text-emerald-600 fill-emerald-600" />
                  Results Updated!
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Change any boundary below &bull; Results, letter grades, and distribution counts update <strong className="text-indigo-700">instantly in real time</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenLogicModal}
            className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 hover:bg-indigo-100/60 px-3 py-1.5 rounded-lg border border-indigo-200/70 transition-colors flex items-center gap-1"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Grading Logic & Formulas
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-slate-500 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            title={isExpanded ? 'Collapse tuner' : 'Expand tuner'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Controls */}
      {isExpanded && (
        <div className="p-4 sm:p-5 bg-white space-y-3">
          {/* Inputs Row */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {/* O */}
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 hover:border-amber-400 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-200/50 transition-all">
              <div className="flex items-center justify-between mb-1">
                <GradeBadge grade="O" size="sm" />
                <span className="text-[10px] text-slate-400 font-bold">10 pts</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium mb-1">K Factor (O)</div>
              <input
                type="number"
                step="0.05"
                value={localK['O']}
                onChange={(e) => handleInputChange(e, 'O')}
                onBlur={() => handleValueChange('O', localK['O'])}
                onKeyDown={(e) => e.key === 'Enter' && handleValueChange('O', localK['O'])}
                className="w-full font-mono font-bold text-slate-900 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* A+ */}
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 hover:border-emerald-400 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-200/50 transition-all">
              <div className="flex items-center justify-between mb-1">
                <GradeBadge grade="A+" size="sm" />
                <span className="text-[10px] text-slate-400 font-bold">9 pts</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium mb-1">K Factor (A+)</div>
              <input
                type="number"
                step="0.05"
                value={localK['A+']}
                onChange={(e) => handleInputChange(e, 'A+')}
                onBlur={() => handleValueChange('A+', localK['A+'])}
                onKeyDown={(e) => e.key === 'Enter' && handleValueChange('A+', localK['A+'])}
                className="w-full font-mono font-bold text-slate-900 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* A */}
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 hover:border-teal-400 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-200/50 transition-all">
              <div className="flex items-center justify-between mb-1">
                <GradeBadge grade="A" size="sm" />
                <span className="text-[10px] text-slate-400 font-bold">8 pts</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium mb-1">K Factor (A)</div>
              <input
                type="number"
                step="0.05"
                value={localK['A']}
                onChange={(e) => handleInputChange(e, 'A')}
                onBlur={() => handleValueChange('A', localK['A'])}
                onKeyDown={(e) => e.key === 'Enter' && handleValueChange('A', localK['A'])}
                className="w-full font-mono font-bold text-slate-900 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* B+ */}
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 hover:border-blue-400 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200/50 transition-all">
              <div className="flex items-center justify-between mb-1">
                <GradeBadge grade="B+" size="sm" />
                <span className="text-[10px] text-slate-400 font-bold">7 pts</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium mb-1">K Factor (B+)</div>
              <input
                type="number"
                step="0.05"
                value={localK['B+']}
                onChange={(e) => handleInputChange(e, 'B+')}
                onBlur={() => handleValueChange('B+', localK['B+'])}
                onKeyDown={(e) => e.key === 'Enter' && handleValueChange('B+', localK['B+'])}
                className="w-full font-mono font-bold text-slate-900 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* B */}
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 hover:border-indigo-400 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200/50 transition-all">
              <div className="flex items-center justify-between mb-1">
                <GradeBadge grade="B" size="sm" />
                <span className="text-[10px] text-slate-400 font-bold">6 pts</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium mb-1">K Factor (B)</div>
              <input
                type="number"
                step="0.05"
                value={localK['B']}
                onChange={(e) => handleInputChange(e, 'B')}
                onBlur={() => handleValueChange('B', localK['B'])}
                onKeyDown={(e) => e.key === 'Enter' && handleValueChange('B', localK['B'])}
                className="w-full font-mono font-bold text-slate-900 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Validation Alert */}
          {validationError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Quick Presets & Status */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-slate-400 text-[11px] font-medium mr-1">Quick Presets:</span>
              <button
                type="button"
                onClick={() => applyPreset({ 'O': 1.5, 'A+': 0.75, 'A': 0.0, 'B+': -0.75, 'B': -2.0 }, 'Current Defaults')}
                className="px-2.5 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-medium text-[11px] transition-colors"
              >
                Defaults (1.5, 0.75, 0, -0.75, -2)
              </button>
              <button
                type="button"
                onClick={() => applyPreset({ 'O': 1.5, 'A+': 1.0, 'A': 0.5, 'B+': 0.0, 'B': -0.5 }, 'Classic Balanced')}
                className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-medium text-[11px] transition-colors"
              >
                Classic (1.5, 1.0, 0.5, 0, -0.5)
              </button>
              <button
                type="button"
                onClick={() => applyPreset({ 'O': 1.8, 'A+': 1.0, 'A': 0.2, 'B+': -0.6, 'B': -1.6 }, 'Strict O')}
                className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-medium text-[11px] transition-colors"
              >
                Strict O (1.8, 1.0, 0.2, -0.6, -1.6)
              </button>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Grade C covers below Grade B down to 45 marks.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function handleInputChange(e, grade) {
    const val = e.target.value;
    handleValueChange(grade, val);
  }
}
