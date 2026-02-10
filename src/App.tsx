import React, { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { AppLayout } from './layout/AppLayout';
import { PAGES } from './pages/registry';
import { WalletProvider } from './context/WalletContext';
import { OrganizationProvider } from './context/OrganizationContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Box, CircularProgress } from '@mui/material';

// Loading fallback
const PageLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
    <CircularProgress />
  </Box>
);

export default function App() {
  return (
    <ErrorBoundary>
      <WalletProvider>
        <OrganizationProvider>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/home" replace />} />
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
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </OrganizationProvider>
      </WalletProvider>
    </ErrorBoundary>
  );
}
