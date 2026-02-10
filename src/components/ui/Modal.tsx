import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

interface ModalProps {
    open: boolean;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    onClose: () => void;
    footer?: React.ReactNode;
    maxW?: string;
}

export function Modal({
    open,
    title,
    subtitle,
    children,
    onClose,
    footer,
    maxW = "920px",
}: ModalProps) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        if (open) window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    return (
        <AnimatePresence>
            {open ? (
                <>
                    <motion.div
                        className="fixed inset-0 z-40 bg-black/35 dark:bg-black/60"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        transition={{ duration: 0.18 }}
                        className="fixed inset-x-0 top-[8vh] z-50 mx-auto w-[min(980px,calc(100vw-2rem))] overflow-hidden rounded-[28px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-[0_30px_90px_rgba(2,8,23,0.22)] dark:shadow-[0_30px_90px_rgba(0,0,0,0.5)]"
                        style={{ maxWidth: maxW }}
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="flex items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-700 px-5 py-4">
                            <div>
                                <div className="text-lg font-semibold text-slate-900 dark:text-white">{title}</div>
                                {subtitle && <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">{subtitle}</div>}
                            </div>
                            <button
                                className="rounded-2xl p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                                onClick={onClose}
                                aria-label="Close"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="max-h-[70vh] overflow-auto px-5 py-4">{children}</div>
                        {footer && <div className="border-t border-slate-200 dark:border-slate-700 px-5 py-4">{footer}</div>}
                    </motion.div>
                </>
            ) : null}
        </AnimatePresence>
    );
}
