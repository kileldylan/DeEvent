// src/pages/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  useTheme,
  useMediaQuery,
  Drawer,
  Button,
  IconButton,
} from '@mui/material';
import {
  People as PeopleIcon,
  Business as BusinessIcon,
  Event as EventIcon,
  MonetizationOn as MoneyIcon,
  PendingActions as PendingIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosConfig';
import Header from '../../components/layouts/Header';
import Sidebar from '../../components/layouts/Sidebar';
import Footer from '../../components/layouts/Footer';

const AdminDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axiosInstance.get('/admin/stats/');
        console.log('Admin stats loaded:', response.data);
        setStats(response.data);
      } catch (err) {
        console.error('Stats fetch failed:', err);
        setError(
          err.response?.data?.detail ||
            'Failed to load dashboard statistics. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleDrawerToggle = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress size={60} thickness={4} color="primary" />
      </Box>
    );
  }

  const {
    total_users = 0,
    new_users = 0,
    active_users_30d = 0,
    total_organizers = 0,
    total_organizations = 0,
    pending_kyc = 0,
  } = stats || {};

  const statCards = [
    {
      title: 'Total Users',
      value: total_users.toLocaleString(),
      sub: `${new_users} new today • ${active_users_30d} active (30d)`,
      icon: <PeopleIcon fontSize="large" />,
      color: theme.palette.primary.main,
    },
    {
      title: 'Organizers',
      value: total_organizers.toLocaleString(),
      sub: 'Creators & Hosts',
      icon: <BusinessIcon fontSize="large" />,
      color: theme.palette.success.main,
    },
    {
      title: 'Organizations',
      value: total_organizations.toLocaleString(),
      sub: `${pending_kyc} KYC pending review`,
      icon: <BusinessIcon fontSize="large" />,
      color: theme.palette.info.main,
      chip:
        pending_kyc > 0 ? (
          <Chip label={`${pending_kyc} pending`} color="warning" size="small" />
        ) : null,
    },
  ];

  const drawerContent = (
    <Sidebar
      open={mobileDrawerOpen}
      onClose={handleDrawerToggle}
      variant={isMobile ? 'temporary' : 'permanent'}
    />
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar */}
      {!isMobile && drawerContent}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileDrawerOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, width: { sm: `calc(100% - 260px)` } }}>
        {/* Header */}
        <Header onMenuToggle={handleDrawerToggle} />

        {/* Dashboard Content */}
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, pt: { xs: 10, md: 12 } }}>
          {/* Header Section */}
          <Box sx={{ mb: 5 }}>
            <Typography variant="h4" fontWeight="700" color="primary.main" gutterBottom>
              Admin Overview
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Platform control center • {new Date().toLocaleDateString('en-KE')}
            </Typography>
          </Box>

          {/* Pending Alerts */}
          {pending_kyc > 0 && (
            <Alert
              severity="warning"
              variant="filled"
              sx={{ mb: 4, borderRadius: 2 }}
              icon={<PendingIcon />}
            >
              {pending_kyc} KYC/business verifications waiting for review
            </Alert>
          )}

          {/* Stats Cards */}
          <Grid container spacing={3}>
            {statCards.map((card, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                <Card
                  elevation={3}
                  sx={{
                    height: '100%',
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-6px)',
                      boxShadow: theme.shadows[8],
                    },
                  }}
                >
                  <CardContent sx={{ p: 4, textAlign: 'center' }}>
                    <Box
                      sx={{
                        mb: 2,
                        color: card.color,
                        display: 'flex',
                        justifyContent: 'center',
                      }}
                    >
                      {card.icon}
                    </Box>

                    <Typography
                      variant="h4"
                      fontWeight="bold"
                      color={card.color}
                      gutterBottom
                    >
                      {card.value}
                    </Typography>

                    <Typography variant="subtitle1" color="text.secondary">
                      {card.title}
                    </Typography>

                    {card.sub && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1, opacity: 0.8 }}
                      >
                        {card.sub}
                      </Typography>
                    )}

                    {card.chip && <Box sx={{ mt: 2 }}>{card.chip}</Box>}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Quick Actions */}
          <Box sx={{ mt: 6, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<PendingIcon />}
              onClick={() => navigate('/admin/kyc')} // placeholder route
            >
              Review Pending KYC
            </Button>

            <Button
              variant="outlined"
              size="large"
              startIcon={<PeopleIcon />}
              onClick={() => navigate('/admin/users')}
            >
              Manage Users
            </Button>

            <Button
              variant="outlined"
              size="large"
              startIcon={<BusinessIcon />}
              onClick={() => navigate('/admin/organizations')} // placeholder
            >
              View Organizations
            </Button>
          </Box>

          {/* Future Charts Placeholder */}
          <Box sx={{ mt: 6 }}>
            <Typography variant="h6" gutterBottom>
              Growth Trends (Coming Soon)
            </Typography>
            <Card
              sx={{
                height: 300,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 3,
              }}
            >
              <Typography color="text.secondary">
                User & Event growth charts will appear here
              </Typography>
            </Card>
          </Box>
        </Box>

        {/* Footer */}
        <Footer />
      </Box>
    </Box>
  );
};

export default AdminDashboard;