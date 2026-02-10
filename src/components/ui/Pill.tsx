import React from "react";
import { cn } from "@/lib/utils";

export type PillTone = "good" | "warn" | "bad" | "info" | "neutral" | "accent";

interface PillProps {
    label: string;
    tone?: PillTone;
    className?: string;
    onClick?: () => void;
}

export function Pill({ label, tone = "neutral", className, onClick }: PillProps) {
    const map: Record<PillTone, string> = {
        good: "bg-emerald-50 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 ring-emerald-200 dark:ring-emerald-800",
        warn: "bg-amber-50 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 ring-amber-200 dark:ring-amber-800",
        bad: "bg-rose-50 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 ring-rose-200 dark:ring-rose-800",
        info: "bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 ring-blue-200 dark:ring-blue-800",
        neutral: "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 ring-slate-200 dark:ring-slate-700",
        accent: "bg-orange-50 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300 ring-orange-200 dark:ring-orange-800",
    };

    return (
        <span
            className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1", map[tone], className)}
            onClick={onClick}
        >
            {label}
        </span>
    );
}
