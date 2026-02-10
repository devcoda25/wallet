import React from "react";
import { ChevronRight } from "lucide-react";
import { Alt } from "@/types/domain/limits";
import { Pill } from "@/components/ui/Pill";

interface AltCardProps {
    alt: Alt;
    onOpen: (alt: Alt) => void;
}

export function AltCard({ alt, onOpen }: AltCardProps) {
    return (
        <button
            type="button"
            onClick={() => onOpen(alt)}
            className="w-full rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:bg-slate-50"
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Pill label={alt.module} tone="neutral" />
                        {alt.chips.slice(0, 3).map((c) => (
                            <Pill key={c} label={c} tone="info" />
                        ))}
                    </div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">{alt.title}</div>
                    <div className="mt-1 text-sm text-slate-600">{alt.desc}</div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400" />
            </div>
        </button>
    );
}
