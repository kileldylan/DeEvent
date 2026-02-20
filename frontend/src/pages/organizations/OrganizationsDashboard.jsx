// src/pages/organizer/OrganizationsDashboard.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Stack,
  Chip,
  useTheme,
  useMediaQuery,
  Paper,
  alpha,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Event as EventIcon,
  People as PeopleIcon,
  MonetizationOn as MonetizationOnIcon,
  AccessTime as AccessTimeIcon,
  ArrowForward as ArrowForwardIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

// Context and Components
import { useOrganizations } from '../../contexts/OrganizationsContext';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/layouts/Header';
import Sidebar from '../../components/layouts/Sidebar';
import Footer from '../../components/layouts/Footer';

// Format currency for Kenya
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

// Format date
const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy');
  } catch (e) {
    return dateString;
  }
};

const OrganizationsDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  
  const { user } = useAuth();
  const {
    dashboardData,
    currentOrganization,
    organizations,
    loading,
    error,
    fetchDashboardData,
    fetchQuickStats,
    setOrganization,
  } = useOrganizations();

  const [quickStats, setQuickStats] = useState(null);
  const [statsAnchorEl, setStatsAnchorEl] = useState(null);
  const [orgAnchorEl, setOrgAnchorEl] = useState(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleRefresh = () => {
    if (currentOrganization) {
      fetchDashboardData(currentOrganization.id);
      fetchQuickStats(currentOrganization.id).then(setQuickStats);
    }
  };

  const handleStatsMenuOpen = (event) => {
    setStatsAnchorEl(event.currentTarget);
  };

  const handleStatsMenuClose = () => {
    setStatsAnchorEl(null);
  };

  const handleOrgMenuOpen = (event) => {
    setOrgAnchorEl(event.currentTarget);
  };

  const handleOrgMenuClose = () => {
    setOrgAnchorEl(null);
  };

  const handleSelectOrganization = (org) => {
    setOrganization(org);
    handleOrgMenuClose();
  };

  // Fetch quick stats on component mount and when organization changes
  useEffect(() => {
    if (currentOrganization) {
      fetchQuickStats(currentOrganization.id)
        .then(setQuickStats)
        .catch(console.error);
    }
  }, [currentOrganization, fetchQuickStats]);

  // Prepare chart data from API response
  const prepareChartData = () => {
    if (!dashboardData?.revenue_chart) return [];

    return dashboardData.revenue_chart.map(item => ({
      name: format(item.date, 'MMM'),
      revenue: item.revenue,
      tickets: item.tickets_sold,
    }));
  };

  const prepareEventTypeData = () => {
    if (!dashboardData?.event_types) return [];

    const colors = [
      theme.palette.primary.main,
      theme.palette.success.main,
      theme.palette.info.main,
      theme.palette.warning.main,
      theme.palette.error.main,
      '#00ff9d',
      '#9c27b0',
      '#795548',
    ];

    return dashboardData.event_types.map((item, index) => ({
      name: item.event_type.charAt(0).toUpperCase() + item.event_type.slice(1),
      value: item.percentage,
      revenue: item.revenue,
      color: colors[index % colors.length],
    }));
  };

  // Prepare stats cards data
  const statsCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(dashboardData?.metrics?.total_revenue || 0),
      change: `${dashboardData?.metrics?.revenue_growth?.toFixed(1) || 0}%`,
      trend: dashboardData?.metrics?.revenue_growth >= 0 ? 'up' : 'down',
      icon: <MonetizationOnIcon />,
      color: theme.palette.primary.main,
    },
    {
      title: 'Active Events',
      value: dashboardData?.metrics?.active_events || 0,
      change: '+0',
      trend: 'up',
      icon: <EventIcon />,
      color: theme.palette.success.main,
    },
    {
      title: 'Total Attendees',
      value: dashboardData?.metrics?.total_attendees || 0,
      change: '+0',
      trend: 'up',
      icon: <PeopleIcon />,
      color: theme.palette.info.main,
    },
    {
      title: 'Avg. Ticket Price',
      value: formatCurrency(dashboardData?.metrics?.avg_ticket_price || 0),
      change: '-0%',
      trend: 'down',
      icon: <AccessTimeIcon />,
      color: theme.palette.warning.main,
    },
  ];

  // Quick stats cards (real-time data)
  const quickStatsCards = quickStats ? [
    {
      title: "Today's Revenue",
      value: formatCurrency(quickStats.today_revenue),
      subtitle: 'From ticket sales',
      color: theme.palette.success.main,
    },
    {
      title: 'This Week',
      value: formatCurrency(quickStats.week_revenue),
      subtitle: '7-day revenue',
      color: theme.palette.primary.main,
    },
    {
      title: 'Live Events',
      value: quickStats.live_events,
      subtitle: 'Currently running',
      color: theme.palette.warning.main,
    },
    {
      title: 'Pending Payouts',
      value: formatCurrency(quickStats.pending_payouts),
      subtitle: 'Awaiting processing',
      color: theme.palette.error.main,
    },
  ] : [];

  if (loading && !dashboardData) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
        <Sidebar variant="permanent" />
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar */}
      <Box component="nav" sx={{ width: { md: 280 }, flexShrink: { md: 0 } }}>
        <Sidebar
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
        />
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <Sidebar variant="permanent" />
        </Box>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          width: '100%',
          overflow: 'auto',
        }}
      >
        <Header onMenuToggle={handleDrawerToggle} />

        <Box
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3, md: 4 },
            pt: { xs: 10, md: 12 },
            pb: { xs: 2, md: 4 },
          }}
        >
          {/* Error Alert */}
          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 3, borderRadius: 2 }}
              action={
                <Button color="inherit" size="small" onClick={handleRefresh}>
                  Retry
                </Button>
              }
            >
              {error}
            </Alert>
          )}

          {/* Header Section */}
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="h4" fontWeight="700" color="text.primary" gutterBottom>
                Good morning, {user?.firstName || 'Organizer'}! 👋
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Welcome back to your Organizations Dashboard
              </Typography>
              
              {/* Organization Selector */}
              {currentOrganization && (
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={currentOrganization.name}
                    color="primary"
                    size="small"
                    onClick={handleOrgMenuOpen}
                    avatar={
                      currentOrganization.logo ? (
                        <img 
                          src={currentOrganization.logo} 
                          alt={currentOrganization.name}
                          style={{ width: 24, height: 24, borderRadius: '50%' }}
                        />
                      ) : (
                        <EventIcon sx={{ fontSize: 16 }} />
                      )
                    }
                  />
                  <Typography variant="caption" color="text.secondary">
                    {currentOrganization.is_verified && '✓ Verified'}
                    {currentOrganization.org_type === 'business' ? ' • Business' : ' • Personal'}
                  </Typography>
                </Box>
              )}
            </Box>

            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                disabled={loading}
              >
                Refresh
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/organizer/events/create')}
              >
                New Event
              </Button>
            </Stack>
          </Box>

          {/* Quick Stats Row */}
          {quickStatsCards.length > 0 && (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {quickStatsCards.map((stat, index) => (
                <Grid item xs={6} sm={3} key={index}>
                  <Paper
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: alpha(stat.color, 0.05),
                      border: `1px solid ${alpha(stat.color, 0.1)}`,
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <Box sx={{ position: 'absolute', top: 0, right: 0, opacity: 0.1 }}>
                      <MonetizationOnIcon sx={{ fontSize: 80, color: stat.color }} />
                    </Box>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      {stat.title}
                    </Typography>
                    <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {stat.subtitle}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}

          {/* Main Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {statsCards.map((stat, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          {stat.title}
                        </Typography>
                        <Typography variant="h4" fontWeight="700" sx={{ mb: 1 }}>
                          {stat.value}
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          {stat.trend === 'up' ? (
                            <TrendingUpIcon sx={{ color: 'success.main', fontSize: 16 }} />
                          ) : (
                            <TrendingDownIcon sx={{ color: 'error.main', fontSize: 16 }} />
                          )}
                          <Typography
                            variant="body2"
                            color={stat.trend === 'up' ? 'success.main' : 'error.main'}
                            fontWeight={500}
                          >
                            {stat.change}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            vs last month
                          </Typography>
                        </Stack>
                      </Box>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: alpha(stat.color, 0.1),
                          color: stat.color,
                        }}
                      >
                        {stat.icon}
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Charts Section */}
          {dashboardData && (
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {/* Revenue Chart */}
              <Grid item xs={12} md={8}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                      <Box>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                          Revenue Overview
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Last 6 months performance
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1}>
                        <IconButton size="small" onClick={handleStatsMenuOpen}>
                          <MoreVertIcon />
                        </IconButton>
                        <Menu
                          anchorEl={statsAnchorEl}
                          open={Boolean(statsAnchorEl)}
                          onClose={handleStatsMenuClose}
                        >
                          <MenuItem onClick={handleStatsMenuClose}>
                            <DownloadIcon fontSize="small" sx={{ mr: 1 }} />
                            Export Data
                          </MenuItem>
                          <MenuItem onClick={handleStatsMenuClose}>
                            <ShareIcon fontSize="small" sx={{ mr: 1 }} />
                            Share
                          </MenuItem>
                        </Menu>
                      </Stack>
                    </Stack>
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={prepareChartData()}>
                          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                          <XAxis 
                            dataKey="name" 
                            stroke={theme.palette.text.secondary}
                          />
                          <YAxis 
                            stroke={theme.palette.text.secondary}
                            tickFormatter={(value) => `KES ${value.toLocaleString()}`}
                          />
                          <Tooltip 
                            formatter={(value) => [`KES ${value.toLocaleString()}`, 'Revenue']}
                            labelFormatter={(label) => `Month: ${label}`}
                            contentStyle={{
                              backgroundColor: theme.palette.background.paper,
                              border: `1px solid ${theme.palette.divider}`,
                              borderRadius: theme.shape.borderRadius,
                            }}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke={theme.palette.primary.main}
                            strokeWidth={3}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                            name="Revenue"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Event Types Distribution */}
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Event Types
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Distribution by category
                    </Typography>
                    <Box sx={{ height: 250, display: 'flex', justifyContent: 'center' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={prepareEventTypeData()}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {prepareEventTypeData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value, name, props) => [
                              `${value}% (${formatCurrency(props.payload.revenue)})`,
                              props.payload.name
                            ]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                    <Stack spacing={1} sx={{ mt: 2 }}>
                      {prepareEventTypeData().map((item, index) => (
                        <Stack key={index} direction="row" alignItems="center" justifyContent="space-between">
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Box sx={{ width: 12, height: 12, bgcolor: item.color, borderRadius: 1 }} />
                            <Typography variant="body2">{item.name}</Typography>
                          </Stack>
                          <Typography variant="body2" fontWeight={500}>
                            {item.value.toFixed(1)}%
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Recent Transactions & Upcoming Events */}
          <Grid container spacing={3}>
            {/* Recent Transactions */}
            <Grid item xs={12} md={7}>
              <Card>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                    <Box>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        Recent Transactions
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Last 30 days activity
                      </Typography>
                    </Box>
                    <Button 
                      endIcon={<ArrowForwardIcon />} 
                      onClick={() => navigate('/organizer/transactions')}
                    >
                      View All
                    </Button>
                  </Stack>
                  {dashboardData?.recent_transactions?.length > 0 ? (
                    <Stack spacing={2}>
                      {dashboardData.recent_transactions.slice(0, 5).map((transaction) => (
                        <Paper
                          key={transaction.id}
                          variant="outlined"
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            borderColor: 'divider',
                            '&:hover': { bgcolor: 'action.hover' },
                          }}
                        >
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Box>
                              <Typography variant="subtitle2" fontWeight={500}>
                                {transaction.description}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(transaction.date)}
                              </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography
                                variant="subtitle2"
                                fontWeight={600}
                                color={transaction.type === 'income' ? 'success.main' : 'error.main'}
                              >
                                {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                              </Typography>
                              <Chip
                                label={transaction.status}
                                size="small"
                                sx={{
                                  mt: 0.5,
                                  textTransform: 'capitalize',
                                  bgcolor: transaction.status === 'completed' 
                                    ? alpha(theme.palette.success.main, 0.1)
                                    : alpha(theme.palette.warning.main, 0.1),
                                  color: transaction.status === 'completed'
                                    ? theme.palette.success.main
                                    : theme.palette.warning.main,
                                }}
                              />
                            </Box>
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                      No recent transactions
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Upcoming Events */}
            <Grid item xs={12} md={5}>
              <Card>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                    <Box>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        Upcoming Events
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Next 30 days
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => navigate('/organizer/events/create')}
                    >
                      New Event
                    </Button>
                  </Stack>
                  {dashboardData?.upcoming_events?.length > 0 ? (
                    <Stack spacing={2}>
                      {dashboardData.upcoming_events.slice(0, 5).map((event) => (
                        <Paper
                          key={event.id}
                          variant="outlined"
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            borderColor: 'divider',
                            '&:hover': { bgcolor: 'action.hover' },
                            cursor: 'pointer',
                          }}
                          onClick={() => navigate(`/organizer/events/${event.id}`)}
                        >
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                            <Box>
                              <Typography variant="subtitle2" fontWeight={500} gutterBottom>
                                {event.title}
                              </Typography>
                              <Stack direction="row" spacing={2}>
                                <Typography variant="caption" color="text.secondary">
                                  {formatDate(event.date)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  • {event.attendees} attendees
                                </Typography>
                              </Stack>
                              <Typography variant="caption" color="primary.main" sx={{ display: 'block', mt: 0.5 }}>
                                {formatCurrency(event.revenue)} revenue
                              </Typography>
                            </Box>
                            <Chip
                              label={event.status}
                              size="small"
                              color={event.status === 'active' ? 'success' : 'primary'}
                              sx={{ textTransform: 'capitalize' }}
                            />
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                      No upcoming events
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        <Footer />
      </Box>

      {/* Organization Selection Menu */}
      <Menu
        anchorEl={orgAnchorEl}
        open={Boolean(orgAnchorEl)}
        onClose={handleOrgMenuClose}
        PaperProps={{
          sx: {
            maxHeight: 400,
            width: 300,
          },
        }}
      >
        <MenuItem disabled>
          <Typography variant="subtitle2" color="text.secondary">
            Select Organization
          </Typography>
        </MenuItem>
        
        {organizations.owned?.length > 0 && (
          <>
            <MenuItem disabled>
              <Typography variant="caption" color="text.secondary">
                Owned Organizations
              </Typography>
            </MenuItem>
            {organizations.owned.map((org) => (
              <MenuItem
                key={org.id}
                onClick={() => handleSelectOrganization(org)}
                selected={currentOrganization?.id === org.id}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  {org.logo ? (
                    <img 
                      src={org.logo} 
                      alt={org.name}
                      style={{ width: 24, height: 24, borderRadius: '50%' }}
                    />
                  ) : (
                    <EventIcon sx={{ fontSize: 20 }} />
                  )}
                  <Box>
                    <Typography variant="body2">{org.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {org.is_verified && '✓ '}
                      {org.org_type === 'business' ? 'Business' : 'Personal'}
                    </Typography>
                  </Box>
                </Stack>
              </MenuItem>
            ))}
          </>
        )}

        {organizations.member_of?.length > 0 && (
          <>
            <MenuItem disabled sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Member Of
              </Typography>
            </MenuItem>
            {organizations.member_of.map((org) => (
              <MenuItem
                key={org.id}
                onClick={() => handleSelectOrganization(org)}
                selected={currentOrganization?.id === org.id}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  {org.logo ? (
                    <img 
                      src={org.logo} 
                      alt={org.name}
                      style={{ width: 24, height: 24, borderRadius: '50%' }}
                    />
                  ) : (
                    <EventIcon sx={{ fontSize: 20 }} />
                  )}
                  <Box>
                    <Typography variant="body2">{org.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Member
                    </Typography>
                  </Box>
                </Stack>
              </MenuItem>
            ))}
          </>
        )}

        <Divider sx={{ my: 1 }} />
        <MenuItem onClick={() => {
          handleOrgMenuClose();
          navigate('/organizer/organizations/create');
        }}>
          <AddIcon fontSize="small" sx={{ mr: 1 }} />
          Create New Organization
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default OrganizationsDashboard;