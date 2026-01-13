import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Chip,
  Button,
  Divider,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  People as PeopleIcon,
  Business as BusinessIcon,
  Event as EventIcon,
  MonetizationOn as MoneyIcon,
  PendingActions as PendingIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';

// Mock data - replace with real API fetch later
const mockStats = {
  totalUsers: 1248,
  totalOrganizations: 342,
  activeEvents: 87,
  platformRevenue: '2.8M KES',
  pendingVerifications: 12,
  newRegistrationsToday: 28,
};

const recentActivity = [
  { id: 1, action: 'Business org "Nairobi Events Ltd" approved', time: '2 hours ago', user: 'Admin' },
  { id: 2, action: 'New user registered: kilel@example.com', time: '4 hours ago', user: 'System' },
  { id: 3, action: 'Event "Afrobeat Night" created by DeEvent Productions', time: 'Yesterday', user: 'Organizer' },
  { id: 4, action: 'Payout request of 450,000 KES pending review', time: 'Yesterday', user: 'Organizer' },
];

const AdminDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [loading, setLoading] = useState(true);

  // Simulate API loading
  useEffect(() => {
    setTimeout(() => setLoading(false), 1200);
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        pt: { xs: 10, md: 12 }, // account for fixed header
        pb: 6,
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      {/* Header Section */}
      <Box sx={{ mb: 5 }}>
        <Typography
          variant="h4"
          component="h1"
          fontWeight="700"
          color="primary.main"
          gutterBottom
        >
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Platform overview • {new Date().toLocaleDateString('en-KE')}
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3}>
        {/* Total Users */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3} sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56, mx: 'auto', mb: 2 }}>
                <PeopleIcon fontSize="large" />
              </Avatar>
              <Typography variant="h4" fontWeight="bold" color="primary.main">
                {mockStats.totalUsers.toLocaleString()}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                Total Users
              </Typography>
              <Chip label="+28 today" color="success" size="small" />
            </CardContent>
          </Card>
        </Grid>

        {/* Organizations */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3} sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              <Avatar sx={{ bgcolor: 'primary.light', width: 56, height: 56, mx: 'auto', mb: 2 }}>
                <BusinessIcon fontSize="large" />
              </Avatar>
              <Typography variant="h4" fontWeight="bold" color="primary.main">
                {mockStats.totalOrganizations}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                Organizations
              </Typography>
              <Chip label="12 pending verification" color="warning" size="small" />
            </CardContent>
          </Card>
        </Grid>

        {/* Active Events */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3} sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              <Avatar sx={{ bgcolor: 'primary.dark', width: 56, height: 56, mx: 'auto', mb: 2 }}>
                <EventIcon fontSize="large" />
              </Avatar>
              <Typography variant="h4" fontWeight="bold" color="primary.main">
                {mockStats.activeEvents}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                Active Events
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Revenue */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3} sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              <Avatar sx={{ bgcolor: '#2e7d32', width: 56, height: 56, mx: 'auto', mb: 2 }}>
                <MoneyIcon fontSize="large" />
              </Avatar>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {mockStats.platformRevenue}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                Platform Revenue
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Pending Actions + Recent Activity */}
      <Grid container spacing={3} sx={{ mt: 4 }}>
        {/* Pending Actions */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardHeader
              title="Pending Actions"
              avatar={<PendingIcon color="warning" />}
              titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
            />
            <Divider />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography>Business verifications pending</Typography>
                  <Chip label={mockStats.pendingVerifications} color="warning" size="small" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography>New user registrations today</Typography>
                  <Chip label={mockStats.newRegistrationsToday} color="primary" size="small" />
                </Box>
                <Button variant="outlined" fullWidth sx={{ mt: 2 }}>
                  View All Pending Items
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardHeader
              title="Recent Activity"
              avatar={<TimelineIcon color="primary" />}
              titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
            />
            <Divider />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {recentActivity.map((item) => (
                  <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body1">{item.action}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.time} • {item.user}
                      </Typography>
                    </Box>
                  </Box>
                ))}
                <Button variant="text" sx={{ mt: 1, alignSelf: 'flex-start' }}>
                  View Full Activity Log
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions Bar */}
      <Box sx={{ mt: 6, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Button variant="contained" size="large" startIcon={<EventIcon />}>
          Review Recent Events
        </Button>
        <Button variant="outlined" size="large" startIcon={<BusinessIcon />}>
          Manage Organizations
        </Button>
        <Button variant="outlined" size="large" startIcon={<PeopleIcon />}>
          View User List
        </Button>
        <Button variant="outlined" size="large" startIcon={<MonetizationOnIcon />}>
          Check Revenue Reports
        </Button>
      </Box>
    </Box>
  );
};

export default AdminDashboard;