import React from "react";
import { cn } from "@/lib/utils";
import { Pill } from "./Pill";

interface ProgressBarProps {
    value: number;
    total: number;
    labelLeft?: string;
    labelRight?: string;
    showDetails?: boolean;
    formatValue?: (v: number) => string;
}

export function ProgressBar({
    value,
    total,
    labelLeft,
    labelRight,
    showDetails = true,
    formatValue = (v) => v.toString(),
}: ProgressBarProps) {
    const pct = total <= 0 ? 0 : Math.round((value / total) * 100);
    const clampPct = Math.min(140, Math.max(0, pct));

    const danger = clampPct >= 100;
    const warn = clampPct >= 80 && clampPct < 100;

    // Colors aligned with project theme
    const barColor = danger ? "#F43F5E" : warn ? "#F77F00" : "#03CD8C";

    return (
        <div className="w-full">
            {(labelLeft || labelRight) && (
                <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
                    {labelLeft && <span className="font-semibold">{labelLeft}</span>}
                    {labelRight && <span className="font-semibold">{labelRight}</span>}
                </div>
            )}
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, clampPct)}%`, background: barColor }}
                />
            </div>
            {showDetails && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`${pct}%`} tone={danger ? "bad" : warn ? "warn" : "good"} />
                    <div className="text-xs text-slate-500">
                        Used {formatValue(value)} of {formatValue(total)}
                    </div>
                </div>
            )}
        </div>
    );
}
