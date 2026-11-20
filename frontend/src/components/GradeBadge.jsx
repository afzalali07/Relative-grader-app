import React from 'react';

const gradeStyles = {
  'O': 'bg-amber-100 text-amber-800 border-amber-300 font-bold shadow-sm',
  'A+': 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
  'A': 'bg-teal-100 text-teal-800 border-teal-300 font-semibold',
  'B+': 'bg-blue-100 text-blue-800 border-blue-300 font-semibold',
  'B': 'bg-indigo-100 text-indigo-800 border-indigo-300 font-medium',
  'C': 'bg-slate-100 text-slate-700 border-slate-300 font-medium',
  '-': 'bg-gray-50 text-gray-400 border-gray-200 italic',
};

export default function GradeBadge({ grade, points, showPoints = false, size = 'md' }) {
  const style = gradeStyles[grade] || 'bg-gray-100 text-gray-700 border-gray-200';
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  }[size] || 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border transition-all ${sizeClasses} ${style}`}>
      <span>{grade}</span>
      {showPoints && points !== undefined && points !== null && (
        <span className="text-[11px] opacity-75 font-normal">({points} pts)</span>
      )}
    </span>
  );
}
