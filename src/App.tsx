import React, { Suspense, useState, useEffect } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';

import { AppLayout } from './layout/AppLayout';
import { PAGES } from './pages/registry';
import { WalletProvider } from './context/WalletContext';
import { OrganizationProvider } from './context/OrganizationContext';
import { EduWalletProvider } from './context/EduWalletContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Box, CircularProgress } from '@mui/material';

// Loading fallback
const PageLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
    <CircularProgress />
  </Box>
);

// Mobile Home Route - Redirects to mobile home on mobile devices
function MobileHomeRedirect() {
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) {
      navigate('/mobile-home', { replace: true });
    } else {
      navigate('/home', { replace: true });
    }
  }, [isMobile, navigate]);

  return <PageLoader />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <WalletProvider>
        <OrganizationProvider>
          <EduWalletProvider>
            <Routes>
              <Route element={<AppLayout />}>
                <Route index element={<MobileHomeRedirect />} />
                <Route path="/home" element={<Navigate to="/mobile-home" replace />} />
                {PAGES.map((p) => (
                  <Route
                    key={p.id}
                    path={p.path}
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <p.component />
                      </Suspense>
                    }
                  />
                ))}
              </Route>
              <Route path="*" element={<MobileHomeRedirect />} />
            </Routes>
          </EduWalletProvider>
        </OrganizationProvider>
      </WalletProvider>
    </ErrorBoundary>
  );
}
