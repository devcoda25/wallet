import React from "react";

interface MiniListItem {
    name: string;
    value: string;
    hint?: string;
}

interface MiniListProps {
    title: string;
    items: MiniListItem[];
    icon: React.ReactNode;
}

export function MiniList({ title, items, icon }: MiniListProps) {
    return (
        <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm h-full">
            <div className="flex items-center gap-2 mb-3">
                <div className="text-slate-500 dark:text-slate-400">{icon}</div>
                <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{title}</div>
            </div>
            <div className="space-y-3">
                {items.map((it) => (
                    <div key={it.name}>
                        <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">{it.name}</span>
                            <span className="shrink-0 text-sm font-bold text-slate-900 dark:text-white">{it.value}</span>
                        </div>
                        {it.hint ? <div className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">{it.hint}</div> : null}
                    </div>
                ))}
            </div>
        </div>
    );
}
