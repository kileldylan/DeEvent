// src/pages/admin/AdminUsersManagement.jsx
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
  Delete as DeleteIcon,
  Block as BlockIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  CheckCircle as VerifiedIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosConfig';
import Header from '../../components/layouts/Header';
import Sidebar from '../../components/layouts/Sidebar';
import Footer from '../../components/layouts/Footer';

const AdminUsersManagement = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [dialogAction, setDialogAction] = useState(''); // 'delete', 'deactivate', 'view'

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  // Fetch users
  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (roleFilter === 'organizer') params.append('is_organizer', 'true');
      if (roleFilter === 'staff') params.append('is_staff', 'true');
      if (statusFilter === 'inactive') params.append('is_active', 'false');
      if (searchTerm) params.append('search', searchTerm);

      const response = await axiosInstance.get(`/admin/users/?${params.toString()}`);
      setUsers(response.data.results || response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch users');
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
    fetchUsers();
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Dialog handlers
  const handleOpenDialog = (user, action) => {
    setSelectedUser(user);
    setDialogAction(action);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedUser(null);
  };

  // Deactivate user
  const handleDeactivate = async () => {
    if (!selectedUser) return;
    try {
      const response = await axiosInstance.patch(`/admin/users/${selectedUser.id}/`, {
        is_active: false,
      });
      setUsers(prev =>
        prev.map(user => user.id === selectedUser.id ? response.data : user)
      );
      setSuccess(`User "${selectedUser.email}" deactivated`);
      handleCloseDialog();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to deactivate user');
    }
  };

  // Activate user
  const handleActivate = async (user) => {
    try {
      const response = await axiosInstance.patch(`/admin/users/${user.id}/`, {
        is_active: true,
      });
      setUsers(prev =>
        prev.map(u => u.id === user.id ? response.data : u)
      );
      setSuccess(`User "${user.email}" activated`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to activate user');
    }
  };

  // Delete user
  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      await axiosInstance.delete(`/admin/users/${selectedUser.id}/`);
      setUsers(prev => prev.filter(user => user.id !== selectedUser.id));
      setSuccess(`User "${selectedUser.email}" deleted successfully`);
      handleCloseDialog();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete user');
    }
  };

  const getRoleLabels = (user) => {
    const roles = [];
    if (user.is_staff) roles.push('Admin');
    if (user.is_organizer) roles.push('Organizer');
    if (roles.length === 0) roles.push('User');
    return roles;
  };

  const displayedUsers = users.slice(
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
              Users Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage all registered users on the platform
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
                    label="Role"
                    value={roleFilter}
                    onChange={(e) => {
                      setRoleFilter(e.target.value);
                      setPage(0);
                    }}
                    SelectProps={{ native: true }}
                  >
                    <option value="">All</option>
                    <option value="organizer">Organizer</option>
                    <option value="staff">Admin</option>
                    <option value="user">User</option>
                  </TextField>
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
                    <option value="inactive">Inactive</option>
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
                      setRoleFilter('');
                      setStatusFilter('');
                      fetchUsers();
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
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>User</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Email</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Roles</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Joined</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayedUsers.length > 0 ? (
                    displayedUsers.map((user) => (
                      <TableRow key={user.id} hover>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {user.first_name} {user.last_name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{user.email}</Typography>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5}>
                            {getRoleLabels(user).map((role) => (
                              <Chip
                                key={role}
                                label={role}
                                size="small"
                                color={role === 'Admin' ? 'error' : role === 'Organizer' ? 'primary' : 'default'}
                              />
                            ))}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.is_active ? 'Active' : 'Inactive'}
                            size="small"
                            color={user.is_active ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(user.date_joined).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <IconButton
                              size="small"
                              title="View"
                              onClick={() => handleOpenDialog(user, 'view')}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>

                            {user.is_active ? (
                              <Button
                                size="small"
                                variant="contained"
                                color="warning"
                                startIcon={<BlockIcon />}
                                onClick={() => handleOpenDialog(user, 'deactivate')}
                              >
                                Deactivate
                              </Button>
                            ) : (
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                onClick={() => handleActivate(user)}
                              >
                                Activate
                              </Button>
                            )}

                            <IconButton
                              size="small"
                              color="error"
                              title="Delete"
                              onClick={() => handleOpenDialog(user, 'delete')}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                        <Typography color="text.secondary">No users found</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={users.length}
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

      {/* Deactivate Dialog */}
      <Dialog open={dialogOpen && dialogAction === 'deactivate'} onClose={handleCloseDialog}>
        <DialogTitle>Deactivate User</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to deactivate <strong>{selectedUser?.email}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleDeactivate} variant="contained" color="warning">
            Deactivate
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={dialogOpen && dialogAction === 'delete'} onClose={handleCloseDialog}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            This action cannot be undone!
          </Alert>
          <Typography variant="body2">
            Are you sure you want to permanently delete <strong>{selectedUser?.email}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminUsersManagement;
