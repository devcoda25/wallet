import React from "react";
import { cn } from "@/lib/utils";

const EVZ = {
    green: "#03CD8C",
    orange: "#F77F00",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "accent" | "outline" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
    children: React.ReactNode;
}

export function Button({
    variant = "outline",
    size = "md",
    className,
    children,
    style,
    disabled,
    ...props
}: ButtonProps) {
    const sizes: Record<string, string> = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-2.5 text-sm",
        lg: "px-6 py-3 text-base",
    };
    const base = `inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition focus:outline-none focus:ring-4 ${sizes[size]}`;

    const variants: Record<string, string> = {
        primary: "text-white shadow-[0_12px_24px_rgba(3,205,140,0.22)] hover:opacity-95 focus:ring-emerald-200 dark:focus:ring-emerald-800",
        accent: "text-white shadow-[0_12px_24px_rgba(247,127,0,0.22)] hover:opacity-95 focus:ring-orange-200 dark:focus:ring-orange-800",
        outline: "border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 focus:ring-slate-200 dark:focus:ring-slate-600",
        ghost: "bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:ring-slate-200 dark:focus:ring-slate-600",
        danger: "border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 focus:ring-rose-100 dark:focus:ring-rose-800",
    };

    const customStyle = {
        ...style,
        ...(variant === "primary" ? { background: EVZ.green } : {}),
        ...(variant === "accent" ? { background: EVZ.orange } : {}),
    };

    return (
        <button
            type="button"
            disabled={disabled}
            style={customStyle}
            className={cn(base, variants[variant], disabled && "cursor-not-allowed opacity-60", className)}
            {...props}
        >
            {children}
        </button>
    );
}
