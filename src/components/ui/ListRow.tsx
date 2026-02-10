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
                "flex w-full items-start justify-between gap-3 rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition",
                className
            )}
        >
            <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-900 dark:text-white">{title}</div>
                {subtitle ? <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">{subtitle}</div> : null}
            </div>
            <div className="flex items-center gap-2">
                {right}
                <ChevronRight className="h-5 w-5 text-slate-400 dark:text-slate-500" />
            </div>
        </button>
    );
}
