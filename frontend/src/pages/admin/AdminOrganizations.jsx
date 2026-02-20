// src/pages/admin/AdminOrganizations.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  Stack,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Paper,
  useTheme,
  useMediaQuery,
  Grid,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as ApproveIcon,
  Block as SuspendIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosConfig';
import Header from '../../components/layouts/Header';
import Sidebar from '../../components/layouts/Sidebar';
import Footer from '../../components/layouts/Footer';

const AdminOrganizations = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [dialogAction, setDialogAction] = useState(''); // 'suspend', 'view'
  const [suspendReason, setSuspendReason] = useState('');

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  // Fetch organizations
  useEffect(() => {
    fetchOrganizations();
  }, [statusFilter, typeFilter]);

  const fetchOrganizations = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('org_type', typeFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await axiosInstance.get(`/admin/organizations/?${params.toString()}`);
      setOrganizations(response.data.results || response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch organizations');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = () => {
    setPage(0);
    fetchOrganizations();
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Dialog handlers
  const handleOpenDialog = (org, action) => {
    setSelectedOrg(org);
    setDialogAction(action);
    setSuspendReason('');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedOrg(null);
    setSuspendReason('');
  };

  // Approve organization
  const handleApprove = async () => {
    if (!selectedOrg) return;
    try {
      const response = await axiosInstance.post(`/admin/organizations/${selectedOrg.id}/approve/`);
      setOrganizations(prev =>
        prev.map(org => org.id === selectedOrg.id ? response.data : org)
      );
      setSuccess(`Organization "${selectedOrg.name}" approved successfully`);
      handleCloseDialog();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to approve organization');
    }
  };

  // Suspend organization
  const handleSuspend = async () => {
    if (!selectedOrg) return;
    try {
      const response = await axiosInstance.post(`/admin/organizations/${selectedOrg.id}/suspend/`, {
        reason: suspendReason,
      });
      setOrganizations(prev =>
        prev.map(org => org.id === selectedOrg.id ? response.data : org)
      );
      setSuccess(`Organization "${selectedOrg.name}" suspended`);
      handleCloseDialog();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to suspend organization');
    }
  };

  // Activate organization
  const handleActivate = async (org) => {
    try {
      const response = await axiosInstance.post(`/admin/organizations/${org.id}/activate/`);
      setOrganizations(prev =>
        prev.map(o => o.id === org.id ? response.data : o)
      );
      setSuccess(`Organization "${org.name}" activated`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to activate organization');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'suspended':
        return 'error';
      default:
        return 'default';
    }
  };

  const getTypeLabel = (type) => {
    return type === 'business' ? 'Business' : 'Personal';
  };

  const displayedOrganizations = organizations.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar */}
      <Box component="nav" sx={{ width: { md: 280 }, flexShrink: { md: 0 } }}>
        <Sidebar variant="temporary" open={mobileOpen} onClose={handleDrawerToggle} />
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <Sidebar variant="permanent" />
        </Box>
      </Box>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Header onMenuToggle={handleDrawerToggle} />

        <Box sx={{ flexGrow: 1, p: { xs: 2, sm: 3, md: 4 }, pt: { xs: 10, md: 12 } }}>
          {/* Header Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight="700" gutterBottom>
              Organizations Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              View and manage all registered organizations
            </Typography>
          </Box>

          {/* Alerts */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          {/* Filters & Search */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search by name, email..."
                    value={searchTerm}
                    onChange={handleSearch}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    fullWidth
                    size="small"
                    select
                    label="Status"
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setPage(0);
                    }}
                    SelectProps={{ native: true }}
                  >
                    <option value="">All</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    fullWidth
                    size="small"
                    select
                    label="Type"
                    value={typeFilter}
                    onChange={(e) => {
                      setTypeFilter(e.target.value);
                      setPage(0);
                    }}
                    SelectProps={{ native: true }}
                  >
                    <option value="">All</option>
                    <option value="business">Business</option>
                    <option value="personal">Personal</option>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<SearchIcon />}
                    onClick={handleSearchSubmit}
                  >
                    Search
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('');
                      setTypeFilter('');
                      fetchOrganizations();
                    }}
                  >
                    Reset
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Table */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead sx={{ bgcolor: 'primary.main' }}>
                  <TableRow>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Organization</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Type</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Owner</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Created</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayedOrganizations.length > 0 ? (
                    displayedOrganizations.map((org) => (
                      <TableRow key={org.id} hover>
                        <TableCell>
                          <Stack>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {org.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {org.email}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getTypeLabel(org.org_type)}
                            size="small"
                            variant="outlined"
                            color={org.org_type === 'business' ? 'primary' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={org.status?.charAt(0).toUpperCase() + org.status?.slice(1)}
                            size="small"
                            color={getStatusColor(org.status)}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {org.owner?.first_name} {org.owner?.last_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {org.owner?.email}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(org.created_at).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <IconButton
                              size="small"
                              title="View"
                              onClick={() => handleOpenDialog(org, 'view')}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>

                            {org.status === 'pending' && (
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                startIcon={<ApproveIcon />}
                                onClick={handleApprove}
                              >
                                Approve
                              </Button>
                            )}

                            {org.status === 'active' && (
                              <Button
                                size="small"
                                variant="contained"
                                color="error"
                                startIcon={<SuspendIcon />}
                                onClick={() => handleOpenDialog(org, 'suspend')}
                              >
                                Suspend
                              </Button>
                            )}

                            {org.status === 'suspended' && (
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                onClick={() => handleActivate(org)}
                              >
                                Activate
                              </Button>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                        <Typography color="text.secondary">No organizations found</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={organizations.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
              />
            </TableContainer>
          )}
        </Box>

        <Footer />
      </Box>

      {/* Suspend Dialog */}
      <Dialog open={dialogOpen && dialogAction === 'suspend'} onClose={handleCloseDialog}>
        <DialogTitle>Suspend Organization</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Are you sure you want to suspend <strong>{selectedOrg?.name}</strong>?
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Suspension Reason"
            placeholder="Enter reason for suspension..."
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSuspend} variant="contained" color="error">
            Suspend
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminOrganizations;
