import React from "react";
import { cn } from "@/lib/utils";

const EVZ = {
    green: "#03CD8C",
};

interface SegButtonProps {
    active: boolean;
    label: string;
    onClick: () => void;
}

export function SegButton({ active, label, onClick }: SegButtonProps) {
    return (
        <button
            type="button"
            className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold ring-1 transition",
                active
                    ? "text-white ring-emerald-600"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 ring-slate-200 dark:ring-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
            )}
            style={active ? { background: EVZ.green } : undefined}
            onClick={onClick}
        >
            {label}
        </button>
    );
}
