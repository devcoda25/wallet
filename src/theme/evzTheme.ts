import { createTheme, responsiveFontSizes, ThemeOptions } from '@mui/material/styles';
import { EVZ_COLORS } from './tokens';

// Base theme configuration
const baseTheme: ThemeOptions = {
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
          border: '1px solid',
          borderColor: 'divider'
        }
      }
    }
  }
};

// Light theme
export const evzThemeLight = responsiveFontSizes(
  createTheme({
    ...baseTheme,
    palette: {
      mode: 'light',
      primary: { main: EVZ_COLORS.green },
      secondary: { main: EVZ_COLORS.orange },
      success: { main: '#14B8A6' }, // teal-500
      warning: { main: '#F59E0B' }, // amber-500
      background: {
        default: '#F8FAFC',
        paper: '#FFFFFF'
      },
      text: {
        primary: EVZ_COLORS.slate
      }
    }
  })
);

// Dark theme
export const evzThemeDark = responsiveFontSizes(
  createTheme({
    ...baseTheme,
    palette: {
      mode: 'dark',
      primary: { main: EVZ_COLORS.green },
      secondary: { main: EVZ_COLORS.orange },
      success: { main: '#14B8A6' }, // teal-500
      warning: { main: '#F59E0B' }, // amber-500
      background: {
        default: '#0F172A',
        paper: '#1E293B'
      },
      text: {
        primary: '#F1F5F9'
      }
    }
  })
);
