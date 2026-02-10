import React from "react";

interface PatternCardProps {
    icon: React.ReactNode;
    title: string;
    desc: string;
}

export function PatternCard({ icon, title, desc }: PatternCardProps) {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="text-sm font-semibold text-slate-900">{title}</div>
                    <div className="mt-1 text-sm text-slate-600">{desc}</div>
                </div>
                <div className="grid h-9 w-9 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">{icon}</div>
            </div>
        </div>
    );
}
