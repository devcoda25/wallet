import React from "react";

const EVZ = {
    green: "#03CD8C",
    orange: "#F77F00",
};

interface TinyBarProps {
    value: number;
    max: number;
}

export function TinyBar({ value, max }: TinyBarProps) {
    const width = max <= 0 ? 0 : Math.max(2, Math.min(100, Math.round((value / max) * 100)));
    const color = width >= 85 ? EVZ.orange : EVZ.green;
    return (
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full" style={{ width: `${width}%`, background: color }} />
        </div>
    );
}
