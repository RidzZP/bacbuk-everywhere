import React from "react";

interface ProgressBarProps {
  value: number;
  max: number;
  className?: string;
  showText?: boolean;
}

export default function ProgressBar({ value, max, className = "", showText = false }: ProgressBarProps) {
  const percentage = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;

  return (
    <div className={`w-full ${className}`}>
      {showText && (
        <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-medium">
          <span>Page {value} of {max}</span>
          <span>{percentage}%</span>
        </div>
      )}
      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-600 dark:bg-amber-500 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
