// src/pages/organizations/Organizations.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Stack,
  CircularProgress,
  useTheme,
  useMediaQuery,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  Event as EventIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  TrendingUp as TrendIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import axiosInstance from '../../api/axiosConfig';

// Layout
import Header from '../../components/layouts/Header';
import Sidebar from '../../components/layouts/Sidebar';
import Footer from '../../components/layouts/Footer';

const Organizations = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    totalTicketsSold: 0,
    totalRevenue: 0,
    organizations: [],
  });
  const [loading, setLoading] = useState(true);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [orgRes, eventRes] = await Promise.all([
          axiosInstance.get('/organizations/my/'),
          axiosInstance.get('/events/my/'), // implement this endpoint later
        ]);

        const orgs = orgRes.data || [];
        const events = eventRes.data || [];

        setStats({
          totalEvents: events.length,
          upcomingEvents: events.filter(e => new Date(e.start_date) > new Date()).length,
          totalTicketsSold: events.reduce((sum, e) => sum + (e.tickets_sold || 0), 0),
          totalRevenue: events.reduce((sum, e) => sum + (e.revenue || 0), 0),
          organizations: orgs,
        });
      } catch (err) {
        console.error('Dashboard fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Quick date chips
  const dateRanges = [
    { label: 'Today', active: false },
    { label: 'Yesterday', active: false },
    { label: 'This Week', active: true },
    { label: 'This Month', active: false },
    { label: 'Custom', active: false, icon: <CalendarIcon /> },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#0a0a0a' }}>
      {/* Sidebar */}
      <Box component="nav" sx={{ width: { md: 260 }, flexShrink: { md: 0 } }}>
        <Sidebar variant="temporary" open={mobileOpen} onClose={handleDrawerToggle} />
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <Sidebar variant="permanent" />
        </Box>
      </Box>

      {/* Main */}
      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Header onMenuToggle={handleDrawerToggle} />

        <Box sx={{ flexGrow: 1, p: { xs: 2, sm: 3, md: 4 }, pt: { xs: 10, md: 12 } }}>
          {/* Welcome */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight={700} color="white" gutterBottom>
              Welcome back!
            </Typography>
            <Typography variant="body1" color="rgba(255,255,255,0.7)">
              Here's what's happening with your events today
            </Typography>
          </Box>

          {/* Date Range Selector */}
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 4 }}>
            {dateRanges.map((range) => (
              <Chip
                key={range.label}
                label={range.label}
                icon={range.icon}
                color={range.active ? 'primary' : 'default'}
                variant={range.active ? 'filled' : 'outlined'}
                clickable
                sx={{
                  bgcolor: range.active ? '#006400' : 'rgba(255,255,255,0.08)',
                  color: 'white',
                  borderColor: range.active ? '#4caf50' : 'rgba(255,255,255,0.2)',
                  '&:hover': {
                    bgcolor: range.active ? '#1b5e20' : 'rgba(255,255,255,0.12)',
                  },
                }}
              />
            ))}
          </Stack>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
              <CircularProgress size={60} sx={{ color: '#4caf50' }} />
            </Box>
          ) : (
            <>
              {/* Stats Grid */}
              <Grid container spacing={3} sx={{ mb: 5 }}>
                {[
                  { title: 'Total Events', value: stats.totalEvents, icon: <EventIcon />, color: '#00ff9d' },
                  { title: 'Upcoming', value: stats.upcomingEvents, icon: <CalendarIcon />, color: '#4caf50' },
                  { title: 'Tickets Sold', value: stats.totalTicketsSold, icon: <PeopleIcon />, color: '#00e5ff' },
                  { title: 'Revenue', value: `KES ${stats.totalRevenue.toLocaleString()}`, icon: <MoneyIcon />, color: '#ff9100' },
                ].map((stat, i) => (
                  <Grid item xs={12} sm={6} md={3} key={i}>
                    <Card
                      sx={{
                        height: '100%',
                        bgcolor: '#111',
                        border: '1px solid #222',
                        borderRadius: 4,
                        background: 'linear-gradient(145deg, #111111, #1a1a1a)',
                        boxShadow: `0 8px 32px ${alpha(stat.color, 0.2)}`,
                        transition: 'all 0.4s ease',
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: `0 20px 40px ${alpha(stat.color, 0.3)}`,
                        },
                      }}
                    >
                      <CardContent sx={{ textAlign: 'center', p: 4 }}>
                        <Box sx={{ color: stat.color, mb: 2 }}>
                          {React.cloneElement(stat.icon, { fontSize: 'large' })}
                        </Box>
                        <Typography variant="h3" fontWeight="bold" color="white">
                          {stat.value}
                        </Typography>
                        <Typography variant="subtitle1" color="rgba(255,255,255,0.7)" sx={{ mt: 1 }}>
                          {stat.title}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Your Organizations */}
              <Typography variant="h5" fontWeight={600} color="white" gutterBottom sx={{ mb: 3 }}>
                Your Organizations
              </Typography>

              <Grid container spacing={3}>
                {stats.organizations.length === 0 ? (
                  <Grid item xs={12}>
                    <Card sx={{ bgcolor: '#111', border: '2px dashed #333', p: 6, textAlign: 'center' }}>
                      <Typography color="rgba(255,255,255,0.6)">
                        No organizations yet. Create one to get started!
                      </Typography>
                    </Card>
                  </Grid>
                ) : (
                  stats.organizations.map((org) => (
                    <Grid item xs={12} sm={6} md={4} key={org.id}>
                      <Card
                        sx={{
                          height: '100%',
                          bgcolor: '#111',
                          border: '1px solid #222',
                          borderRadius: 4,
                          transition: 'all 0.3s',
                          '&:hover': { borderColor: '#4caf50', boxShadow: '0 0 20px rgba(76, 175, 80, 0.3)' },
                        }}
                      >
                        <CardContent>
                          <Typography variant="h6" fontWeight={600} color="white">
                            {org.name}
                          </Typography>
                          <Typography variant="body2" color="rgba(255,255,255,0.6)" sx={{ mb: 2 }}>
                            {org.description?.substring(0, 80) || 'No description'}
                          </Typography>
                          <Stack direction="row" spacing={1}>
                            <Chip label={`${org.events_count || 0} Events`} size="small" sx={{ bgcolor: 'rgba(0,255,157,0.2)', color: '#00ff9d' }} />
                            <Chip label="Active" size="small" color="success" />
                          </Stack>
                          <Button fullWidth variant="outlined" sx={{ mt: 3, borderColor: '#4caf50', color: '#4caf50' }}>
                            View Details
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))
                )}

                {/* Create New Org */}
                <Grid item xs={12} sm={6} md={4}>
                  <Card
                    sx={{
                      height: '100%',
                      bgcolor: '#111',
                      border: '2px dashed #333',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      '&:hover': { borderColor: '#4caf50', bgcolor: '#1a1a1a' },
                    }}
                    onClick={() => navigate('/organizations/create')}
                  >
                    <Stack alignItems="center" spacing={2}>
                      <AddIcon sx={{ fontSize: 48, color: '#4caf50' }} />
                      <Typography variant="h6" color="#4caf50">
                        Create New Organization
                      </Typography>
                    </Stack>
                  </Card>
                </Grid>
              </Grid>

              {/* Quick Actions */}
              <Box sx={{ mt: 6, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<EventIcon />}
                  sx={{
                    bgcolor: '#006400',
                    '&:hover': { bgcolor: '#1b5e20' },
                  }}
                >
                  Create New Event
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<BusinessIcon />}
                  sx={{ borderColor: '#4caf50', color: '#4caf50' }}
                >
                  New Organization
                </Button>
              </Box>
            </>
          )}
        </Box>

        <Footer />
      </Box>
    </Box>
  );
};

export default Organizations;