import React from "react";
import { cn } from "@/lib/utils";
import { FundingStatus } from "@/types/domain/limits";
import { Pill } from "@/components/ui/Pill";

const EVZ = {
    green: "#03CD8C",
};

interface FundingCardProps {
    title: string;
    icon: React.ReactNode;
    status: FundingStatus;
    lines: string[];
    footer?: string;
}

function toneForFunding(s: FundingStatus) {
    if (s === "Active") return "good" as const;
    if (s === "Low") return "warn" as const;
    return "bad" as const;
}

export function FundingCard({
    title,
    icon,
    status,
    lines,
    footer,
}: FundingCardProps) {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="text-sm font-semibold text-slate-900">{title}</div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Pill label={status} tone={toneForFunding(status)} />
                    </div>
                </div>
                <div
                    className={cn(
                        "grid h-10 w-10 place-items-center rounded-2xl",
                        status === "Active"
                            ? "bg-emerald-50 text-emerald-700"
                            : status === "Low"
                                ? "bg-amber-50 text-amber-800"
                                : "bg-rose-50 text-rose-700"
                    )}
                >
                    {icon}
                </div>
            </div>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {lines.map((l) => (
                    <li key={l} className="flex items-start gap-2">
                        <span
                            className="mt-2 h-1.5 w-1.5 rounded-full"
                            style={{ background: EVZ.green }}
                        />
                        <span>{l}</span>
                    </li>
                ))}
            </ul>
            {footer && (
                <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
                    {footer}
                </div>
            )}
        </div>
    );
}
