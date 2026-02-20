// src/components/layout/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  useTheme,
  Avatar,
  Chip,
  Tooltip,
  IconButton,
  Menu,
  MenuItem,
  Badge,
  CircularProgress,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import EventIcon from '@mui/icons-material/Event';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import ReceiptIcon from '@mui/icons-material/Receipt';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AddIcon from '@mui/icons-material/Add';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import VerifiedIcon from '@mui/icons-material/Verified';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useOrganizations } from '../../contexts/OrganizationsContext';

const Sidebar = ({ open, onClose, variant = 'permanent' }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { 
    currentOrganization, 
    organizations, 
    loading: orgsLoading,
    setOrganization,
    fetchOrganizationEvents,
    fetchOrganizationTransactions 
  } = useOrganizations();

  const [eventsCount, setEventsCount] = useState(0);
  const [transactionsCount, setTransactionsCount] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [activeEvents, setActiveEvents] = useState(0);
  const [orgMenuAnchor, setOrgMenuAnchor] = useState(null);
  const [notifications, setNotifications] = useState([
    { id: 1, message: 'New event registration', time: '5 min ago', read: false },
    { id: 2, message: 'Ticket sale completed', time: '1 hour ago', read: false },
    { id: 3, message: 'Payment processed', time: '2 hours ago', read: true },
  ]);

    // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return 'KES 0';
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  // Menu items - dynamically updated based on organization data
  const menuItems = [
    { 
      text: 'Dashboard', 
      icon: <DashboardIcon />, 
      path: '/organizer/dashboard',
      count: null,
      show: true,
      roles: ['all'],
    },
    { 
      text: 'Events', 
      icon: <EventIcon />, 
      path: '/organizer/events',
      count: eventsCount,
      show: true,
      roles: ['organizer'],
    },
    { 
      text: 'Organizations', 
      icon: <BusinessIcon />, 
      path: '/organizer/organizations',
      count: organizations?.owned?.length + organizations?.member_of?.length || 0,
      show: true,
      roles: ['organizer', 'admin'],
    },
    { 
      text: 'Revenue', 
      icon: <MonetizationOnIcon />, 
      path: '/organizer/revenue',
      count: formatCurrency(revenue),
      show: currentOrganization?.org_type === 'business',
      roles: ['organizer'],
    },
    { 
      text: 'Analytics', 
      icon: <AssessmentIcon />, 
      path: '/organizer/analytics',
      count: null,
      show: true,
      roles: ['organizer', 'admin'],
    },
    { 
      text: 'Transactions', 
      icon: <ReceiptIcon />, 
      path: '/organizer/transactions',
      count: transactionsCount,
      show: true,
      roles: ['organizer'],
    },
    { 
      text: 'Audience', 
      icon: <PeopleIcon />, 
      path: '/organizer/audience',
      count: '2.4K',
      show: true,
      roles: ['organizer'],
    },
    { 
      text: 'Calendar', 
      icon: <CalendarTodayIcon />, 
      path: '/organizer/calendar',
      count: null,
      show: true,
      roles: ['organizer', 'admin'],
    },
    { 
      text: 'Trends', 
      icon: <TrendingUpIcon />, 
      path: '/organizer/trends',
      count: null,
      show: true,
      roles: ['organizer', 'admin'],
    },
    { 
      text: 'Settings', 
      icon: <SettingsIcon />, 
      path: '/organizer/settings',
      count: null,
      show: true,
      roles: ['all'],
    },
  ];

  // Check if path is active
  const isActive = (path) => location.pathname.startsWith(path);

  // Determine current user's role
  const isAdmin = user?.is_staff || user?.is_superuser || false;
  const isOrganizer = user?.is_organizer || false;
  const currentRole = isAdmin ? 'admin' : isOrganizer ? 'organizer' : 'user';

  // Fetch organization data
  useEffect(() => {
    if (currentOrganization?.id) {
      // Fetch events count
      fetchOrganizationEvents(currentOrganization.id)
        .then(data => {
          setEventsCount(data.count || 0);
          // Calculate active events
          const active = data.results?.filter(event => 
            event.status === 'active' || event.status === 'live'
          ).length || 0;
          setActiveEvents(active);
        })
        .catch(console.error);

      // Fetch transactions count
      fetchOrganizationTransactions(currentOrganization.id)
        .then(data => {
          setTransactionsCount(data.count || 0);
        })
        .catch(console.error);
    }
  }, [currentOrganization, fetchOrganizationEvents, fetchOrganizationTransactions]);

  // Calculate total revenue from dashboard data
  useEffect(() => {
    // This would come from your dashboard API in production
    // For now, we'll set a default value
    if (currentOrganization) {
      setRevenue(currentOrganization.total_revenue || 86113.75);
    }
  }, [currentOrganization]);

  // Handle organization menu
  const handleOrgMenuOpen = (event) => {
    setOrgMenuAnchor(event.currentTarget);
  };

  const handleOrgMenuClose = () => {
    setOrgMenuAnchor(null);
  };

  const handleSelectOrganization = (org) => {
    setOrganization(org);
    handleOrgMenuClose();
    if (onClose) onClose();
  };

  // Handle create new organization
  const handleCreateOrganization = () => {
    navigate('/organizer/organizations/create');
    handleOrgMenuClose();
    if (onClose) onClose();
  };

  // Handle navigation
  const handleNavigation = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  // Get unread notifications count
  const unreadNotifications = notifications.filter(n => !n.read).length;

  const drawerContent = (
    <Box sx={{ 
      width: 280, 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: 'background.paper',
    }}>
      {/* Header with Organization Selector */}
      <Box sx={{ p: 3, position: 'relative' }}>
        {/* Organization Selector */}
        <Box 
          onClick={handleOrgMenuOpen}
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2, 
            mb: 2,
            cursor: 'pointer',
            '&:hover': { opacity: 0.8 },
          }}
        >
          <Avatar
            sx={{
              width: 48,
              height: 48,
              bgcolor: 'primary.main',
              fontWeight: 600,
              fontSize: '1.25rem',
              border: `2px solid ${theme.palette.primary.light}`,
            }}
          >
            {currentOrganization?.name?.charAt(0)?.toUpperCase() || user?.firstName?.charAt(0) || 'O'}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography 
                variant="h6" 
                fontWeight="600" 
                noWrap
                sx={{ 
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {currentOrganization?.name || 'Select Organization'}
              </Typography>
              {currentOrganization?.is_verified && (
                <Tooltip title="Verified Organization">
                  <VerifiedIcon sx={{ fontSize: 16, color: 'success.main' }} />
                </Tooltip>
              )}
            </Box>
            <Typography variant="body2" color="text.secondary" noWrap>
              {user?.email || 'organizer@example.com'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <SwapHorizIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                Switch organization
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Organization Status */}
        {currentOrganization && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Chip 
              label={currentOrganization.org_type === 'business' ? 'Business Account' : 'Personal Account'} 
              color={currentOrganization.org_type === 'business' ? 'primary' : 'success'}
              size="small" 
              sx={{ fontWeight: 500 }}
            />
            <IconButton 
              size="small"
              onClick={() => navigate('/organizer/notifications')}
              sx={{ position: 'absolute', top: 16, right: 16 }}
            >
              <Badge badgeContent={unreadNotifications} color="error">
                <NotificationsIcon fontSize="small" />
              </Badge>
            </IconButton>
          </Box>
        )}
      </Box>

      <Divider />

      {/* Menu Items */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        <List disablePadding>
          {menuItems
            .filter(item => item.show && (item.roles?.includes('all') || item.roles?.includes(currentRole)))
            .map((item) => (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  selected={isActive(item.path)}
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    borderRadius: 2,
                    py: 1.25,
                    px: 2,
                    '&.Mui-selected': {
                      background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                      color: 'primary.contrastText',
                      '&:hover': {
                        background: `linear-gradient(90deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'inherit',
                      },
                      '& .MuiChip-root': {
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        color: 'inherit',
                        fontWeight: 600,
                      },
                    },
                    '&:hover': {
                      bgcolor: 'action.hover',
                      transform: 'translateX(2px)',
                      transition: 'all 0.2s ease',
                    },
                  }}
                >
                  <ListItemIcon sx={{ 
                    color: isActive(item.path) ? 'inherit' : 'text.secondary',
                    minWidth: 40,
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{ 
                      fontWeight: isActive(item.path) ? 600 : 500,
                      fontSize: '0.875rem',
                    }}
                  />
                  {item.count !== null && (
                    <Chip
                      label={item.count}
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: '0.6875rem',
                        fontWeight: 500,
                        bgcolor: isActive(item.path) 
                          ? 'rgba(255, 255, 255, 0.2)' 
                          : 'action.selected',
                        '& .MuiChip-label': {
                          px: 1,
                        },
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            ))}
        </List>

        {/* Quick Actions */}
        <Box sx={{ mt: 3, px: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Quick Actions
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <ListItemButton
              onClick={() => handleNavigation('/organizer/events/create')}
              sx={{
                borderRadius: 2,
                py: 1,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
              }}
            >
              <AddIcon sx={{ mr: 1, fontSize: 20 }} />
              <ListItemText 
                primary="Create Event" 
                primaryTypographyProps={{ 
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              />
            </ListItemButton>
            <ListItemButton
              onClick={() => handleNavigation('/organizer/events')}
              sx={{
                borderRadius: 2,
                py: 1,
                border: `1px solid ${theme.palette.divider}`,
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <EventIcon sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
              <ListItemText 
                primary="Manage Events" 
                primaryTypographyProps={{ 
                  fontWeight: 500,
                  fontSize: '0.875rem',
                }}
              />
            </ListItemButton>
          </Box>
        </Box>
      </Box>

      {/* Footer with Stats */}
      <Box sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          Organization Overview
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Active Events
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {activeEvents} Events
            </Typography>
          </Box>
          <Chip 
            label={activeEvents > 0 ? "Live" : "No Events"} 
            color={activeEvents > 0 ? "success" : "default"} 
            size="small" 
            sx={{ height: 20, fontSize: '0.6875rem' }}
          />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Total Revenue
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {formatCurrency(revenue)}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="text.secondary">
              Team
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {currentOrganization?.member_count || 1} Members
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <>
      <Drawer
        variant={variant}
        open={open}
        onClose={onClose}
        sx={{
          width: 280,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
            borderRight: `1px solid ${theme.palette.divider}`,
            boxShadow: '2px 0 20px rgba(0, 0, 0, 0.1)',
            // Offset the drawer under the fixed AppBar so it doesn't get overlapped
            top: { xs: 56, md: 64 },
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Organization Selection Menu */}
      <Menu
        anchorEl={orgMenuAnchor}
        open={Boolean(orgMenuAnchor)}
        onClose={handleOrgMenuClose}
        PaperProps={{
          sx: {
            maxHeight: 400,
            width: 300,
            mt: 1,
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          },
        }}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
      >
        <MenuItem disabled sx={{ py: 1.5 }}>
          <Typography variant="subtitle2" color="text.primary" fontWeight={600}>
            Select Organization
          </Typography>
        </MenuItem>
        
        {orgsLoading ? (
          <MenuItem disabled>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', py: 2 }}>
              <CircularProgress size={20} />
            </Box>
          </MenuItem>
        ) : (
          <>
            {/* Owned Organizations */}
            {organizations?.owned?.length > 0 && (
              <>
                <MenuItem disabled sx={{ pt: 1 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>
                    OWNED ORGANIZATIONS
                  </Typography>
                </MenuItem>
                {organizations.owned.map((org) => (
                  <MenuItem
                    key={org.id}
                    onClick={() => handleSelectOrganization(org)}
                    selected={currentOrganization?.id === org.id}
                    sx={{
                      py: 1.5,
                      borderRadius: 1,
                      mx: 1,
                      mb: 0.5,
                      '&.Mui-selected': {
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        '&:hover': {
                          bgcolor: 'primary.dark',
                        },
                      },
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ width: '100%' }}>
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          bgcolor: currentOrganization?.id === org.id ? 'white' : 'primary.main',
                          color: currentOrganization?.id === org.id ? 'primary.main' : 'white',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                        }}
                      >
                        {org.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography 
                            variant="body2" 
                            fontWeight={500}
                            sx={{ 
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {org.name}
                          </Typography>
                          {org.is_verified && (
                            <VerifiedIcon sx={{ fontSize: 14, color: currentOrganization?.id === org.id ? 'white' : 'success.main' }} />
                          )}
                        </Box>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: currentOrganization?.id === org.id ? 'rgba(255,255,255,0.8)' : 'text.secondary',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {org.org_type === 'business' ? 'Business Account' : 'Personal Account'}
                        </Typography>
                      </Box>
                      {currentOrganization?.id === org.id && (
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: 'white',
                          }}
                        />
                      )}
                    </Stack>
                  </MenuItem>
                ))}
              </>
            )}

            {/* Member Of Organizations */}
            {organizations?.member_of?.length > 0 && (
              <>
                <MenuItem disabled sx={{ pt: 2 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>
                    MEMBER OF
                  </Typography>
                </MenuItem>
                {organizations.member_of.map((org) => (
                  <MenuItem
                    key={org.id}
                    onClick={() => handleSelectOrganization(org)}
                    selected={currentOrganization?.id === org.id}
                    sx={{
                      py: 1.5,
                      borderRadius: 1,
                      mx: 1,
                      mb: 0.5,
                      '&.Mui-selected': {
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        '&:hover': {
                          bgcolor: 'primary.dark',
                        },
                      },
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ width: '100%' }}>
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          bgcolor: currentOrganization?.id === org.id ? 'white' : 'primary.light',
                          color: currentOrganization?.id === org.id ? 'primary.main' : 'white',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                        }}
                      >
                        {org.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography 
                          variant="body2" 
                          fontWeight={500}
                          sx={{ 
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {org.name}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: currentOrganization?.id === org.id ? 'rgba(255,255,255,0.8)' : 'text.secondary',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          Member • {org.owner_name || 'Team Member'}
                        </Typography>
                      </Box>
                      {currentOrganization?.id === org.id && (
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: 'white',
                          }}
                        />
                      )}
                    </Stack>
                  </MenuItem>
                ))}
              </>
            )}
          </>
        )}

        <Divider sx={{ my: 1 }} />
        
        <MenuItem 
          onClick={handleCreateOrganization}
          sx={{
            py: 1.5,
            borderRadius: 1,
            mx: 1,
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <AddIcon fontSize="small" sx={{ mr: 1.5, color: 'primary.main' }} />
          <Typography variant="body2" fontWeight={500}>
            Create New Organization
          </Typography>
        </MenuItem>
      </Menu>
    </>
  );
};

// Import Stack if not already imported
import Stack from '@mui/material/Stack';

export default Sidebar;