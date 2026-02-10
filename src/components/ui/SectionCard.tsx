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
        <div className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-sm ${className || ""}`}>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="text-sm font-semibold text-slate-900">{title}</div>
                    {subtitle ? <div className="mt-1 text-xs text-slate-500">{subtitle}</div> : null}
                </div>
                {right}
            </div>
            {children ? <div className="mt-4">{children}</div> : null}
        </div>
    );
}
