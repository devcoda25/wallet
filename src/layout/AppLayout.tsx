import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { MobileDrawer } from "@/components/layout/MobileDrawer";
import { cn } from "@/lib/utils";

// Page transition variants
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 300,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.98,
    transition: {
      duration: 0.2,
    },
  },
};

export function AppLayout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const location = useLocation();

  // Detect mobile view on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close drawer on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  return (
    <div
      className={cn(
        "min-h-screen bg-slate-50 dark:bg-slate-900",
        "font-sans text-slate-900 dark:text-white",
        "selection:bg-emerald-100 dark:selection:bg-emerald-900",
        "selection:text-emerald-900 dark:selection:text-emerald-100",
        "transition-colors"
      )}
    >
      {/* Header */}
      <Header onMobileMenuOpen={() => setIsMobileOpen(true)} />

      {/* Main Content */}
      <div className={cn(
        "mx-auto",
        isMobileView ? "px-0" : "max-w-[1440px] px-4 py-8 md:px-6"
      )}>
        <div className={cn(
          isMobileView ? "" : "grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]"
        )}>
          {/* Sidebar - Desktop only */}
          {!isMobileView && <Sidebar />}

          {/* Main Content Area */}
          <main className={cn("min-w-0", isMobileView ? "pb-20" : "")}>
            <AnimatePresence>
              <motion.div
                key={location.pathname}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="min-h-[calc(100vh-200px)]"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Bottom Navigation - Mobile only */}
      {isMobileView && <MobileBottomNav />}

      {/* Mobile Drawer */}
      <MobileDrawer isOpen={isMobileOpen} onClose={() => setIsMobileOpen(false)} />
    </div>
  );
}
