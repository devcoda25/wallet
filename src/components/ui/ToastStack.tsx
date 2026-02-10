import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Toast } from "@/types/domain/limits";

interface ToastStackProps {
    toasts: Toast[];
    onDismiss: (id: string) => void;
}

export function ToastStack({ toasts, onDismiss }: ToastStackProps) {
    return (
        <div className="pointer-events-none fixed right-4 top-4 z-50 w-[min(460px,calc(100vw-2rem))] space-y-2">
            <AnimatePresence initial={false}>
                {toasts.map((t) => (
                    <motion.div
                        key={t.id}
                        initial={{ opacity: 0, y: -10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                        transition={{ duration: 0.18 }}
                        className="pointer-events-auto rounded-3xl border border-slate-200 bg-white/90 p-3 shadow-[0_18px_45px_rgba(2,8,23,0.18)] backdrop-blur"
                        role="status"
                        aria-live="polite"
                    >
                        <div className="flex items-start gap-3">
                            <div
                                className={cn(
                                    "mt-0.5 grid h-9 w-9 place-items-center rounded-2xl",
                                    t.kind === "success" && "bg-emerald-50 text-emerald-700",
                                    t.kind === "warn" && "bg-amber-50 text-amber-800",
                                    t.kind === "error" && "bg-rose-50 text-rose-700",
                                    t.kind === "info" && "bg-blue-50 text-blue-700"
                                )}
                            >
                                {t.kind === "error" || t.kind === "warn" ? <AlertTriangle className="h-5 w-5" /> : <Check className="h-5 w-5" />}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-sm font-semibold text-slate-900">{t.title}</div>
                                {t.message && <div className="mt-0.5 text-sm text-slate-600">{t.message}</div>}
                            </div>
                            <button className="rounded-2xl p-2 text-slate-500 hover:bg-slate-100" onClick={() => onDismiss(t.id)} aria-label="Dismiss">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
