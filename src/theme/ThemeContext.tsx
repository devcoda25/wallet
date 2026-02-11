// ============================================================================
// Theme Context - Dark/Light Mode Management
// ============================================================================

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { EVZ_COLORS } from './tokens';

export type ThemeMode = 'light' | 'dark';

// ============================================================================
// Light Theme
// ============================================================================

const lightTheme = createTheme({
    palette: {
        mode: 'light',
        primary: { main: EVZ_COLORS.green },
        secondary: { main: EVZ_COLORS.orange },
        success: { main: '#14B8A6' },
        warning: { main: '#F59E0B' },
        background: {
            default: '#F8FAFC',
            paper: '#FFFFFF'
        },
        text: {
            primary: '#0F172A',
            secondary: '#64748B'
        },
        divider: '#E2E8F0'
    },
    shape: { borderRadius: 16 },
    typography: {
        fontFamily: [
            'ui-sans-serif',
            'system-ui',
            '-apple-system',
            'Segoe UI',
            'Roboto',
            'Helvetica',
            'Arial',
            'Apple Color Emoji',
            'Segoe UI Emoji'
        ].join(','),
        button: { textTransform: 'none', fontWeight: 700 }
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: { borderRadius: 18 }
            }
        },
        MuiPaper: {
            styleOverrides: {
                root: { borderRadius: 22 }
            }
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
                }
            }
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: '#FFFFFF',
                    color: '#0F172A'
                }
            }
        }
    }
});

// ============================================================================
// Dark Theme
// ============================================================================

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: { main: EVZ_COLORS.green },
        secondary: { main: EVZ_COLORS.orange },
        success: { main: '#14B8A6' },
        warning: { main: '#F59E0B' },
        background: {
            default: '#0F172A',
            paper: '#1E293B'
        },
        text: {
            primary: '#F8FAFC',
            secondary: '#94A3B8'
        },
        divider: '#334155'
    },
    shape: { borderRadius: 16 },
    typography: {
        fontFamily: [
            'ui-sans-serif',
            'system-ui',
            '-apple-system',
            'Segoe UI',
            'Roboto',
            'Helvetica',
            'Arial',
            'Apple Color Emoji',
            'Segoe UI Emoji'
        ].join(','),
        button: { textTransform: 'none', fontWeight: 700 }
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: { borderRadius: 18 }
            }
        },
        MuiPaper: {
            styleOverrides: {
                root: { borderRadius: 22 }
            }
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3)'
                }
            }
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: '#1E293B',
                    color: '#F8FAFC'
                }
            }
        }
    }
});

// ============================================================================
// Theme Context
// ============================================================================

interface ThemeContextType {
    mode: ThemeMode;
    toggleTheme: () => void;
    setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

// ============================================================================
// Provider Component
// ============================================================================

interface ThemeProviderProps {
    children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
    const [mode, setMode] = useState<ThemeMode>(() => {
        if (typeof window === 'undefined') return 'light';

        // Check localStorage first
        const saved = localStorage.getItem('theme-mode');
        if (saved === 'dark' || saved === 'light') return saved;

        // Default to light mode
        return 'light';
    });

    // Apply theme mode to document body for Tailwind dark mode
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(mode);
        localStorage.setItem('theme-mode', mode);
    }, [mode]);

    // Listen for system theme changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
            const saved = localStorage.getItem('theme-mode');
            if (!saved) {
                setMode(e.matches ? 'dark' : 'light');
            }
        };
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const toggleTheme = useCallback(() => {
        setMode((prev) => {
            const newMode = prev === 'light' ? 'dark' : 'light';
            return newMode;
        });
    }, []);

    const setTheme = useCallback((newMode: ThemeMode) => {
        setMode(newMode);
    }, []);

    const theme = useMemo(() => (mode === 'light' ? lightTheme : darkTheme), [mode]);

    return (
        <ThemeContext.Provider value={{ mode, toggleTheme, setTheme }}>
            <MuiThemeProvider theme={theme}>
                {children}
            </MuiThemeProvider>
        </ThemeContext.Provider>
    );
}

// ============================================================================
// Hook
// ============================================================================

export function useThemeMode(): ThemeMode {
    const context = useContext(ThemeContext);
    if (!context) {
        return 'light';
    }
    return context.mode;
}

export function useThemeToggle(): () => void {
    const context = useContext(ThemeContext);
    if (!context) {
        return () => { };
    }
    return context.toggleTheme;
}

export { ThemeContext as ThemeModeContext };
