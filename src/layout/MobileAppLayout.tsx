import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/layout/Header";
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

// Detect mobile device
function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth < 768;
}

export function MobileAppLayout() {
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
      <main
        className={cn(
          "min-h-[calc(100vh-64px)]",
          isMobileView ? "pb-20" : "pb-8"
        )}
      >
        <div className={cn(
          "mx-auto",
          isMobileView ? "px-0" : "max-w-[1440px] px-4 py-8 md:px-6"
        )}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className={cn(
                isMobileView ? "" : "grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]"
              )}
            >
              {/* Main content area */}
              <div className={cn(
                isMobileView ? "" : "min-w-0"
              )}>
                <Outlet />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom Navigation */}
      {isMobileView && <MobileBottomNav />}

      {/* Mobile Drawer */}
      <MobileDrawer isOpen={isMobileOpen} onClose={() => setIsMobileOpen(false)} />
    </div>
  );
}
