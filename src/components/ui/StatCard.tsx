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
            ? "bg-emerald-50 text-emerald-700"
            : tone === "warn"
                ? "bg-amber-50 text-amber-800"
                : tone === "bad"
                    ? "bg-rose-50 text-rose-700"
                    : tone === "info"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-slate-50 text-slate-700";

    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="text-xs font-semibold text-slate-500">{title}</div>
                    <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{value}</div>
                    <div className="mt-1 text-xs text-slate-600">{sub}</div>
                </div>
                <div className={cn("grid h-10 w-10 place-items-center rounded-2xl", bg)}>{icon}</div>
            </div>
        </div>
    );
}
