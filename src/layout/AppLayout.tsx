import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileDrawer } from "@/components/layout/MobileDrawer";

export function AppLayout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  // Close drawer on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      <Header onMobileMenuOpen={() => setIsMobileOpen(true)} />

      <div className="mx-auto max-w-[1440px] px-4 py-8 md:px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
          <Sidebar />
          <main className="min-w-0">
            <Outlet />
          </main>
        </div>
      </div>

      <MobileDrawer isOpen={isMobileOpen} onClose={() => setIsMobileOpen(false)} />
    </div>
  );
}
