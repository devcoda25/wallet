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
                    {label && <div className="text-xs font-semibold text-slate-600">{label}</div>}
                    {hint && <div className="text-xs text-slate-500">{hint}</div>}
                </div>
            )}
            <input
                className={cn(
                    "w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:ring-4 focus:ring-emerald-100",
                    error && "border-rose-300 focus:ring-rose-100",
                    className
                )}
                {...props}
            />
            {error && <div className="mt-1 text-xs text-rose-600">{error}</div>}
        </div>
    );
}
