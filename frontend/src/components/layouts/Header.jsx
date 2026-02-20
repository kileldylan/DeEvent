// src/components/layout/Header.jsx
import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Box,
  useMediaQuery,
  useTheme,
  Badge,
  InputBase,
  alpha,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header = ({ onMenuToggle }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 3 } }}>
        {/* Left: Mobile Menu + Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {isMobile && (
            <IconButton
              onClick={onMenuToggle}
              sx={{
                color: 'text.primary',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 700,
              letterSpacing: '0.5px',
              background: 'linear-gradient(90deg, #006400, #4caf50)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: { xs: 'none', sm: 'block' },
            }}
          >
            DeEvent
          </Typography>

          {/* Search Bar */}
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              position: 'relative',
              borderRadius: 2,
              bgcolor: alpha(theme.palette.text.primary, 0.05),
              '&:hover': {
                bgcolor: alpha(theme.palette.text.primary, 0.08),
              },
              ml: 2,
              width: 300,
            }}
          >
            <Box
              sx={{
                padding: theme.spacing(0, 2),
                height: '100%',
                position: 'absolute',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <SearchIcon fontSize="small" color="action" />
            </Box>
            <InputBase
              placeholder="Search events, organizations..."
              sx={{
                color: 'text.primary',
                pl: `calc(1em + ${theme.spacing(4)})`,
                pr: 1,
                width: '100%',
                '& .MuiInputBase-input': {
                  padding: theme.spacing(1.25, 1, 1.25, 0),
                },
              }}
            />
          </Box>
        </Box>

        {/* Right: Icons + User Menu */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Notifications */}
          <IconButton
            sx={{
              color: 'text.primary',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <Badge badgeContent={3} color="error">
              <NotificationsNoneIcon />
            </Badge>
          </IconButton>

          {/* Settings */}
          <IconButton
            sx={{
              color: 'text.primary',
              '&:hover': { bgcolor: 'action.hover' },
            }}
            onClick={() => navigate('/settings')}
          >
            <SettingsOutlinedIcon />
          </IconButton>

          {/* User Avatar & Menu */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
            <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {user?.fullName || user?.firstName || 'Admin'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.isOrganizer ? 'Organizer' : user?.isStaff ? 'Staff' : 'User'}
              </Typography>
            </Box>

            <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
              <Avatar
                alt={user?.fullName || 'User'}
                src={user?.avatar}
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: 'primary.main',
                  border: `2px solid ${theme.palette.primary.light}`,
                  fontSize: '1rem',
                  fontWeight: 600,
                }}
              >
                {user?.firstName?.charAt(0) || 'U'}
              </Avatar>
            </IconButton>
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
              sx: {
                mt: 1.5,
                minWidth: 200,
                borderRadius: 2,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                '& .MuiMenuItem-root': {
                  px: 2,
                  py: 1.5,
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                },
              },
            }}
          >
            <MenuItem onClick={() => navigate('/profile')}>
              <PersonOutlineIcon sx={{ mr: 1.5, fontSize: 20 }} />
              Profile
            </MenuItem>
            <MenuItem onClick={() => navigate('/settings')}>
              <SettingsOutlinedIcon sx={{ mr: 1.5, fontSize: 20 }} />
              Settings
            </MenuItem>
            <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;