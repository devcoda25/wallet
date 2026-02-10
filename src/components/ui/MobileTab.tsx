import React from "react";
import { cn } from "@/lib/utils";

const EVZ = {
    green: "#03CD8C",
};

interface MobileTabProps {
    label: string;
    icon: React.ReactNode;
    active?: boolean;
    onClick: () => void;
    badge?: string;
}

export function MobileTab({ label, icon, active, onClick, badge }: MobileTabProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "relative flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-xs font-semibold",
                active ? "text-white" : "text-slate-700 hover:bg-slate-100"
            )}
            style={active ? { background: EVZ.green } : undefined}
        >
            <div className={cn("relative", active ? "text-white" : "text-slate-700")}>{icon}</div>
            <div className="leading-none">{label}</div>
            {badge && (
                <span className="absolute right-2 top-1 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {badge}
                </span>
            )}
        </button>
    );
}
