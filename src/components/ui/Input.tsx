import React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    hint?: string;
    error?: string;
}

export function Input({ label, hint, error, className, ...props }: InputProps) {
    return (
        <div className="w-full">
            {(label || hint) && (
                <div className="mb-2 flex items-center justify-between gap-3">
                    {label && <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">{label}</div>}
                    {hint && <div className="text-xs text-slate-500 dark:text-slate-500">{hint}</div>}
                </div>
            )}
            <input
                className={cn(
                    "w-full rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm font-semibold text-slate-900 dark:text-white outline-none transition focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/50",
                    error && "border-rose-300 dark:border-rose-600 focus:ring-rose-100 dark:focus:ring-rose-900/50",
                    className
                )}
                {...props}
            />
            {error && <div className="mt-1 text-xs text-rose-600 dark:text-rose-400">{error}</div>}
        </div>
    );
}
