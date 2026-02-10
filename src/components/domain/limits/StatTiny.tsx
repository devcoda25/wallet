import React from "react";

interface StatTinyProps {
    title: string;
    value: string;
    icon: React.ReactNode;
}

export function StatTiny({ title, value, icon }: StatTinyProps) {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="text-xs font-semibold text-slate-500">{title}</div>
                    <div className="mt-1 text-base font-semibold text-slate-900">{value}</div>
                </div>
                <div className="grid h-9 w-9 place-items-center rounded-2xl bg-slate-50 text-slate-700">{icon}</div>
            </div>
        </div>
    );
}
