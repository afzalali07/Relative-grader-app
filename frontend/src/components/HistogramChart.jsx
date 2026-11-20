import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell
} from 'recharts';

export default function HistogramChart({
  title,
  subtitle,
  data,
  xLabel,
  yLabel,
  barColor = '#4f46e5',
  hoverColor = '#4338ca',
  isTransformed = false
}) {
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white text-xs p-2.5 rounded-lg shadow-xl border border-slate-800">
          <div className="font-semibold text-slate-200 mb-1">{title}</div>
          <div className="text-slate-300">
            Range: <span className="font-mono text-amber-300 font-bold">{item.label}</span>
          </div>
          <div className="text-slate-300">
            Frequency: <span className="font-mono text-emerald-400 font-bold">{item.count} student(s)</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const totalCount = data.reduce((sum, item) => sum + (item.count || 0), 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col h-full">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isTransformed ? 'bg-violet-600' : 'bg-indigo-600'}`} />
            {title}
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-semibold">
          N = {totalCount}
        </span>
      </div>

      <div className="w-full h-64 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#64748b' }}
              interval={0}
              angle={-25}
              textAnchor="end"
              height={40}
              tickLine={false}
              stroke="#cbd5e1"
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748b' }}
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              stroke="#cbd5e1"
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
            <Bar dataKey="count" fill={barColor} radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={barColor}
                  className="transition-colors duration-200 hover:opacity-85"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 text-center text-xs text-slate-400 font-medium">
        {xLabel} vs {yLabel}
      </div>
    </div>
  );
}
