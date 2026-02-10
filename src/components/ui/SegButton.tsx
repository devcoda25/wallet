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
                active ? "text-white ring-emerald-600" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
            )}
            style={active ? { background: EVZ.green } : undefined}
            onClick={onClick}
        >
            {label}
        </button>
    );
}
