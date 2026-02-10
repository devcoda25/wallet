import React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionCardProps {
    title: string;
    desc: string;
    icon: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
}

export function ActionCard({ title, desc, icon, onClick, disabled }: ActionCardProps) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={cn(
                "flex w-full items-center justify-between gap-3 rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition",
                disabled && "opacity-50 cursor-not-allowed"
            )}
        >
            <div className="flex items-center gap-3 min-w-0">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                    {icon}
                </div>
                <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-900 dark:text-white">{title}</div>
                    <div className="truncate text-xs text-slate-500 dark:text-slate-400">{desc}</div>
                </div>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400 dark:text-slate-500" />
        </button>
    );
}
