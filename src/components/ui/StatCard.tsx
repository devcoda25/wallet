import React from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
    icon: React.ReactNode;
    title: string;
    value: string;
    sub: string;
    tone?: "neutral" | "good" | "warn" | "bad" | "info";
}

export function StatCard({ icon, title, value, sub, tone = "neutral" }: StatCardProps) {
    const bg =
        tone === "good"
            ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
            : tone === "warn"
                ? "bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300"
                : tone === "bad"
                    ? "bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300"
                    : tone === "info"
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300";

    return (
        <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">{title}</div>
                    <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{value}</div>
                    <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">{sub}</div>
                </div>
                <div className={cn("grid h-10 w-10 place-items-center rounded-2xl", bg)}>{icon}</div>
            </div>
        </div>
    );
}
