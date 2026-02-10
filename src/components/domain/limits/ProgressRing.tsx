import React from "react";
import { cn } from "@/lib/utils";

const EVZ = {
    green: "#03CD8C",
    orange: "#F77F00",
};

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

interface ProgressRingProps {
    value: number;
    label: string;
    sub: string;
    tone: "good" | "warn" | "bad" | "neutral";
}

export function ProgressRing({ value, label, sub, tone }: ProgressRingProps) {
    const pctv = clamp(value, 0, 100);
    const size = 78;
    const stroke = 10;
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const dash = (pctv / 100) * c;
    const color = tone === "bad" ? "#F43F5E" : tone === "warn" ? EVZ.orange : EVZ.green;

    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="text-xs font-semibold text-slate-500">{label}</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">{sub}</div>
                </div>
                <div className="relative grid place-items-center">
                    <svg width={size} height={size} className="-rotate-90">
                        <circle
                            cx={size / 2}
                            cy={size / 2}
                            r={r}
                            stroke="#E2E8F0"
                            strokeWidth={stroke}
                            fill="none"
                        />
                        <circle
                            cx={size / 2}
                            cy={size / 2}
                            r={r}
                            stroke={color}
                            strokeWidth={stroke}
                            fill="none"
                            strokeDasharray={`${dash} ${c}`}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute text-sm font-semibold text-slate-900">
                        {Math.round(pctv)}%
                    </div>
                </div>
            </div>
        </div>
    );
}
