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
        good: "bg-emerald-50 text-emerald-700 ring-emerald-200",
        warn: "bg-amber-50 text-amber-800 ring-amber-200",
        bad: "bg-rose-50 text-rose-700 ring-rose-200",
        info: "bg-blue-50 text-blue-700 ring-blue-200",
        neutral: "bg-slate-50 text-slate-700 ring-slate-200",
        accent: "bg-orange-50 text-orange-800 ring-orange-200",
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
