import React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ListRowProps {
    title: string;
    subtitle?: string;
    right?: React.ReactNode;
    onClick?: () => void;
    className?: string;
}

export function ListRow({ title, subtitle, right, onClick, className }: ListRowProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "flex w-full items-start justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50 transition",
                className
            )}
        >
            <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-900">{title}</div>
                {subtitle ? <div className="mt-1 text-sm text-slate-600">{subtitle}</div> : null}
            </div>
            <div className="flex items-center gap-2">
                {right}
                <ChevronRight className="h-5 w-5 text-slate-400" />
            </div>
        </button>
    );
}
