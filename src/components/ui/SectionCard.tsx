import React from "react";

interface SectionCardProps {
    title: string;
    subtitle?: string;
    right?: React.ReactNode;
    children?: React.ReactNode;
    className?: string;
}

export function SectionCard({ title, subtitle, right, children, className }: SectionCardProps) {
    return (
        <div className={`rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm ${className || ""}`}>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">{title}</div>
                    {subtitle ? <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</div> : null}
                </div>
                {right}
            </div>
            {children ? <div className="mt-4">{children}</div> : null}
        </div>
    );
}
