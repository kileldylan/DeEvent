// theme.js - Mohamed Djoudir Financial Dashboard Dark Theme
import { createTheme } from '@mui/material/styles';

const getTheme = (mode = 'dark') => createTheme({
  palette: {
    mode: 'dark', // Force dark theme
    primary: {
      main: '#1E88E5', // Bright blue (like the dashboard accent)
      light: '#64B5F6',
      dark: '#1565C0',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#00E5FF', // Cyan/teal accent
      light: '#6FF9FF',
      dark: '#00B2CC',
    },
    success: {
      main: '#00C853', // Green for positive values
      light: '#5EFC82',
      dark: '#009624',
    },
    error: {
      main: '#FF5252', // Red for negative values
      light: '#FF867F',
      dark: '#C50E29',
    },
    warning: {
      main: '#FFB300', // Amber/yellow
      light: '#FFE54C',
      dark: '#C68400',
    },
    info: {
      main: '#29B6F6', // Light blue
      light: '#73E8FF',
      dark: '#0086C3',
    },
    background: {
      default: '#0A0A0A', // Pure black background
      paper: '#111111', // Slightly lighter cards
      card: '#1A1A1A', // Card backgrounds
      hover: '#1E1E1E', // Hover states
    },
    text: {
      primary: '#FFFFFF', // Pure white text
      secondary: '#B0B0B0', // Gray text for labels
      disabled: '#666666', // Disabled text
      hint: '#888888', // Hint text
    },
    divider: '#222222', // Dark gray dividers
    action: {
      active: '#FFFFFF',
      hover: 'rgba(255, 255, 255, 0.08)', // Subtle hover
      selected: 'rgba(30, 136, 229, 0.16)', // Blue selection
      disabled: 'rgba(255, 255, 255, 0.3)',
      disabledBackground: 'rgba(255, 255, 255, 0.12)',
    },
    // Custom colors for dashboard
    custom: {
      gradient: {
        blue: 'linear-gradient(135deg, #1E88E5 0%, #00E5FF 100%)',
        green: 'linear-gradient(135deg, #00C853 0%, #64DD17 100%)',
        purple: 'linear-gradient(135deg, #7B1FA2 0%, #E040FB 100%)',
        orange: 'linear-gradient(135deg, #FF9800 0%, #FF5722 100%)',
      },
      card: {
        background: 'linear-gradient(145deg, #111111, #1A1A1A)',
        border: '#222222',
        shadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      letterSpacing: '-0.5px',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
      letterSpacing: '-0.25px',
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
      letterSpacing: '-0.1px',
      lineHeight: 1.4,
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.4,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1.4,
    },
    subtitle1: {
      fontWeight: 500,
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    subtitle2: {
      fontWeight: 500,
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
    body1: {
      fontSize: '0.875rem',
      lineHeight: 1.7,
    },
    body2: {
      fontSize: '0.75rem',
      lineHeight: 1.6,
      color: '#B0B0B0',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '0.875rem',
      letterSpacing: '0.25px',
    },
    caption: {
      fontSize: '0.6875rem',
      color: '#888888',
      lineHeight: 1.5,
    },
    overline: {
      fontSize: '0.625rem',
      fontWeight: 600,
      letterSpacing: '1px',
      textTransform: 'uppercase',
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0 1px 3px rgba(0,0,0,0.5)',
    '0 3px 6px rgba(0,0,0,0.4)',
    '0 6px 12px rgba(0,0,0,0.35)',
    '0 12px 24px rgba(0,0,0,0.3)',
    '0 24px 48px rgba(0,0,0,0.25)',
    ...Array(18).fill('none'),
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#0A0A0A',
          color: '#FFFFFF',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#111111',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#333333',
            borderRadius: '4px',
            '&:hover': {
              background: '#444444',
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          background: 'linear-gradient(145deg, #111111, #1A1A1A)',
          border: '1px solid #222222',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          position: 'relative',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 16px 48px rgba(0, 0, 0, 0.5)',
            borderColor: '#333333',
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: 'linear-gradient(90deg, transparent, #333333, transparent)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#111111',
        },
        elevation1: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        },
        elevation2: {
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
        },
        elevation3: {
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(10, 10, 10, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid #222222',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#111111',
          borderRight: '1px solid #222222',
          boxShadow: '4px 0 20px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontWeight: 600,
          letterSpacing: '0.25px',
          textTransform: 'none',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #1E88E5 0%, #00E5FF 100%)',
          boxShadow: '0 4px 20px rgba(30, 136, 229, 0.3)',
          color: '#FFFFFF',
          '&:hover': {
            background: 'linear-gradient(135deg, #1565C0 0%, #00B2CC 100%)',
            boxShadow: '0 8px 32px rgba(30, 136, 229, 0.4)',
          },
          '&.Mui-disabled': {
            background: '#333333',
            color: '#666666',
          },
        },
        outlined: {
          borderWidth: '1.5px',
          borderColor: '#333333',
          color: '#FFFFFF',
          '&:hover': {
            borderColor: '#1E88E5',
            backgroundColor: 'rgba(30, 136, 229, 0.08)',
          },
        },
        text: {
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
          },
        },
      },
      defaultProps: {
        disableElevation: true,
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: '#FFFFFF',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            transform: 'scale(1.1)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            backgroundColor: '#111111',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#333333',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#1E88E5',
              borderWidth: '2px',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#B0B0B0',
          },
          '& .MuiInputBase-input': {
            color: '#FFFFFF',
            '&::placeholder': {
              color: '#666666',
            },
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          color: '#FFFFFF',
          '&.Mui-disabled': {
            color: '#666666',
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          backgroundColor: '#111111',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(30, 136, 229, 0.16)',
            '&:hover': {
              backgroundColor: 'rgba(30, 136, 229, 0.24)',
            },
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          margin: '4px 8px',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
          },
          '&.Mui-selected': {
            background: 'linear-gradient(90deg, rgba(30, 136, 229, 0.2), rgba(0, 229, 255, 0.1))',
            '&:hover': {
              background: 'linear-gradient(90deg, rgba(30, 136, 229, 0.3), rgba(0, 229, 255, 0.2))',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
          fontSize: '0.75rem',
          height: 24,
        },
        colorPrimary: {
          backgroundColor: 'rgba(30, 136, 229, 0.2)',
          color: '#1E88E5',
        },
        colorSuccess: {
          backgroundColor: 'rgba(0, 200, 83, 0.2)',
          color: '#00C853',
        },
        colorError: {
          backgroundColor: 'rgba(255, 82, 82, 0.2)',
          color: '#FF5252',
        },
        colorWarning: {
          backgroundColor: 'rgba(255, 179, 0, 0.2)',
          color: '#FFB300',
        },
        colorInfo: {
          backgroundColor: 'rgba(41, 182, 246, 0.2)',
          color: '#29B6F6',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: '#222222',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          backgroundColor: '#222222',
        },
        bar: {
          borderRadius: 4,
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          backgroundColor: '#333333',
          color: '#FFFFFF',
        },
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: {
          border: '2px solid #111111',
          fontSize: '0.625rem',
          fontWeight: 600,
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          backgroundColor: '#111111',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#1A1A1A',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(30, 136, 229, 0.08)',
            '&:hover': {
              backgroundColor: 'rgba(30, 136, 229, 0.12)',
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #222222',
          padding: '16px',
        },
        head: {
          color: '#B0B0B0',
          fontWeight: 600,
          fontSize: '0.875rem',
        },
        body: {
          color: '#FFFFFF',
          fontSize: '0.875rem',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          border: '1px solid',
        },
        standardSuccess: {
          backgroundColor: 'rgba(0, 200, 83, 0.1)',
          borderColor: 'rgba(0, 200, 83, 0.3)',
          color: '#00C853',
        },
        standardError: {
          backgroundColor: 'rgba(255, 82, 82, 0.1)',
          borderColor: 'rgba(255, 82, 82, 0.3)',
          color: '#FF5252',
        },
        standardWarning: {
          backgroundColor: 'rgba(255, 179, 0, 0.1)',
          borderColor: 'rgba(255, 179, 0, 0.3)',
          color: '#FFB300',
        },
        standardInfo: {
          backgroundColor: 'rgba(41, 182, 246, 0.1)',
          borderColor: 'rgba(41, 182, 246, 0.3)',
          color: '#29B6F6',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#222222',
          color: '#FFFFFF',
          fontSize: '0.75rem',
          borderRadius: 8,
          padding: '8px 12px',
          border: '1px solid #333333',
        },
        arrow: {
          color: '#222222',
          '&::before': {
            border: '1px solid #333333',
          },
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1A1A1A',
          border: '1px solid #333333',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.5)',
          borderRadius: 12,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1A1A1A',
          border: '1px solid #333333',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.5)',
          borderRadius: 12,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#111111',
          border: '1px solid #333333',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6)',
          borderRadius: 16,
        },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(4px)',
        },
      },
    },
  },
  // Custom breakpoints
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
  // Transitions
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },
  // Z-index
  zIndex: {
    mobileStepper: 1000,
    speedDial: 1050,
    appBar: 1100,
    drawer: 1200,
    modal: 1300,
    snackbar: 1400,
    tooltip: 1500,
  },
});

export default getTheme;