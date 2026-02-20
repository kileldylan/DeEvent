import React, { useEffect, useState } from 'react';
import { Container, Grid, Paper, Typography, CircularProgress, Box } from '@mui/material';
import { useAdmin } from '../../contexts/AdminContext';

const StatCard = ({ title, value }) => (
  <Paper sx={{ p: 2, height: '100%' }} elevation={1}>
    <Typography variant="subtitle2" color="text.secondary">{title}</Typography>
    <Typography variant="h5" sx={{ mt: 1 }}>{value}</Typography>
  </Paper>
);

const AdminAnalytics = () => {
  const { fetchAdminStats, adminStats, loading } = useAdmin();
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLocalLoading(true);
      try {
        await fetchAdminStats();
      } catch (err) {
        console.error('Failed to load admin stats', err);
        if (mounted) setError('Failed to load stats');
      } finally {
        if (mounted) setLocalLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [fetchAdminStats]);

  const stats = adminStats || {};

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom>Platform Analytics</Typography>

      {(localLoading || loading) && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Typography color="error">{error}</Typography>
      )}

      {!localLoading && !error && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <StatCard title="Total Users" value={stats.total_users ?? 0} />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard title="New Users (today)" value={stats.new_users ?? 0} />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard title="Active Users (30d)" value={stats.active_users_30d ?? 0} />
          </Grid>

          <Grid item xs={12} md={4}>
            <StatCard title="Total Organizers" value={stats.total_organizers ?? 0} />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard title="Total Organizations" value={stats.total_organizations ?? 0} />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard title="Pending KYC" value={stats.pending_kyc ?? 0} />
          </Grid>

          <Grid item xs={12} md={4}>
            <StatCard title="Total Events" value={stats.total_events ?? 0} />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard title="Active Events" value={stats.active_events ?? 0} />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard title="Tickets Sold" value={stats.total_tickets_sold ?? 0} />
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }} elevation={1}>
              <Typography variant="subtitle2" color="text.secondary">Total Revenue (KES)</Typography>
              <Typography variant="h6" sx={{ mt: 1 }}>{stats.total_revenue_kes ?? 0}</Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }} elevation={1}>
              <Typography variant="subtitle2" color="text.secondary">Pending Payouts</Typography>
              <Typography variant="h6" sx={{ mt: 1 }}>{stats.pending_payouts ?? 0}</Typography>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default AdminAnalytics;
