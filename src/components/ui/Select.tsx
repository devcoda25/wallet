import React from "react";
import { cn } from "@/lib/utils";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    hint?: string;
    options: Array<{ label: string; value: string }>;
}

export function Select({ label, hint, options, className, ...props }: SelectProps) {
    return (
        <div className="w-full">
            {(label || hint) && (
                <div className="mb-2 flex items-center justify-between gap-3">
                    {label && <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">{label}</div>}
                    {hint && <div className="text-xs text-slate-500 dark:text-slate-500">{hint}</div>}
                </div>
            )}
            <select
                className={cn(
                    "w-full rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm font-semibold text-slate-900 dark:text-white outline-none transition focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/50",
                    className
                )}
                {...props}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
