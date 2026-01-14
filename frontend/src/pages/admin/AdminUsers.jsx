// src/pages/admin/AdminUsers.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  Chip,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  Stack,
  Button,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  DataGrid,
  GridToolbar,
  GridActionsCellItem,
} from '@mui/x-data-grid';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Block as BlockIcon,
  CheckCircle as CheckIcon,
  Business as BusinessIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import axiosInstance from '../../api/axiosConfig';

// Layout Components
import Header from '../../components/layouts/Header';
import Sidebar from '../../components/layouts/Sidebar';
import Footer from '../../components/layouts/Footer';

const AdminUsers = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get('/auth/admin/users/');
      console.log('Fetched users:', response.data);
      // Safely handle paginated response
      setUsers(response.data.results || response.data || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter logic
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.first_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.last_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phone || '').includes(searchTerm);

    const matchesRole =
      roleFilter === 'all' ||
      (roleFilter === 'organizer' && user.is_organizer) ||
      (roleFilter === 'staff' && user.is_staff) ||
      (roleFilter === 'regular' && !user.is_organizer && !user.is_staff);

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && user.is_active) ||
      (statusFilter === 'inactive' && !user.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Columns - explicit headerName, better flex/width balance
  const columns = [
    {
      field: 'full_name',
      headerName: 'Name',
      flex: 1.3,
      minWidth: 180,
      valueGetter: (_, row) => `${row.first_name || ''} ${row.last_name || ''}`.trim() || '—',
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1.5,
      minWidth: 220,
    },
    {
      field: 'phone',
      headerName: 'Phone',
      width: 140,
    },
    {
      field: 'roles',
      headerName: 'Roles',
      width: 200,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap' }}>
          {params.row.is_staff && <Chip label="Staff" size="small" color="primary" />}
          {params.row.is_organizer && <Chip label="Organizer" size="small" color="success" />}
          {params.row.is_superuser && <Chip label="Superuser" size="small" color="error" />}
          {!params.row.is_staff && !params.row.is_organizer && <Chip label="User" size="small" />}
        </Stack>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      renderCell: (params) => (
        <Chip
          label={params.row.is_active ? 'Active' : 'Inactive'}
          color={params.row.is_active ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'verified',
      headerName: 'Verified',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.row.is_verified ? 'Yes' : 'No'}
          color={params.row.is_verified ? 'success' : 'warning'}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 160,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', justifyContent: 'center' }}>
          <Tooltip title="Edit User">
            <IconButton size="small" onClick={() => console.log('Edit:', params.row.id)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={params.row.is_active ? 'Deactivate' : 'Activate'}>
            <IconButton
              size="small"
              onClick={() => handleToggleActive(params.row.id, !params.row.is_active)}
              color={params.row.is_active ? 'error' : 'success'}
            >
              {params.row.is_active ? <BlockIcon fontSize="small" /> : <CheckIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          {!params.row.is_organizer && (
            <Tooltip title="Make Organizer">
              <IconButton
                size="small"
                onClick={() => handleMakeOrganizer(params.row.id)}
                color="info"
              >
                <BusinessIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      ),
    },
  ];

  const handleToggleActive = async (userId, newStatus) => {
    try {
      await axiosInstance.post(`/auth/admin/users/${userId}/toggle-active/`);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: newStatus } : u))
      );
    } catch (err) {
      alert('Failed to update user status');
    }
  };

  const handleMakeOrganizer = async (userId) => {
    try {
      await axiosInstance.post(`/auth/admin/users/${userId}/make-organizer/`);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_organizer: true } : u))
      );
    } catch (err) {
      alert('Failed to promote user');
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Box component="nav" sx={{ width: { md: 260 }, flexShrink: { md: 0 } }}>
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
          {/* Header */}
          <Box
            sx={{
              mb: 3,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="h4" fontWeight="700" color="primary.main">
                User Management
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {loading ? 'Loading...' : `${filteredUsers.length} of ${users.length} users`}
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={fetchUsers}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
              {error}
            </Alert>
          )}

          {/* Filters & Search */}
          <Paper
            elevation={2}
            sx={{
              p: { xs: 2, sm: 3 },
              mb: 3,
              borderRadius: theme.shape.borderRadius,
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              alignItems="center"
              justifyContent="space-between"
              sx={{ flexWrap: 'wrap' }}
            >
              <TextField
                size="small"
                placeholder="Search by name, email, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ flexGrow: 1, minWidth: 250 }}
              />

              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip
                  label="All Roles"
                  color={roleFilter === 'all' ? 'primary' : 'default'}
                  variant={roleFilter === 'all' ? 'filled' : 'outlined'}
                  onClick={() => setRoleFilter('all')}
                  clickable
                />
                <Chip
                  label="Organizers"
                  color={roleFilter === 'organizer' ? 'success' : 'default'}
                  variant={roleFilter === 'organizer' ? 'filled' : 'outlined'}
                  onClick={() => setRoleFilter('organizer')}
                  clickable
                />
                <Chip
                  label="Staff"
                  color={roleFilter === 'staff' ? 'primary' : 'default'}
                  variant={roleFilter === 'staff' ? 'filled' : 'outlined'}
                  onClick={() => setRoleFilter('staff')}
                  clickable
                />
                <Chip
                  label="Regular"
                  color={roleFilter === 'regular' ? 'info' : 'default'}
                  variant={roleFilter === 'regular' ? 'filled' : 'outlined'}
                  onClick={() => setRoleFilter('regular')}
                  clickable
                />
              </Stack>

              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip
                  label="All Status"
                  color={statusFilter === 'all' ? 'primary' : 'default'}
                  variant={statusFilter === 'all' ? 'filled' : 'outlined'}
                  onClick={() => setStatusFilter('all')}
                  clickable
                />
                <Chip
                  label="Active"
                  color={statusFilter === 'active' ? 'success' : 'default'}
                  variant={statusFilter === 'active' ? 'filled' : 'outlined'}
                  onClick={() => setStatusFilter('active')}
                  clickable
                />
                <Chip
                  label="Inactive"
                  color={statusFilter === 'inactive' ? 'error' : 'default'}
                  variant={statusFilter === 'inactive' ? 'filled' : 'outlined'}
                  onClick={() => setStatusFilter('inactive')}
                  clickable
                />
              </Stack>
            </Stack>
          </Paper>

          {/* DataGrid - full width, no right gap */}
          <Paper
            sx={{
              flexGrow: 1,
              width: '100%',
              borderRadius: theme.shape.borderRadius,
              overflow: 'hidden',
              boxShadow: theme.shadows[3],
            }}
          >
            <DataGrid
              rows={filteredUsers}
              columns={columns}
              pageSizeOptions={[10, 25, 50, 100]}
              checkboxSelection
              disableRowSelectionOnClick
              loading={loading}
              slots={{ toolbar: GridToolbar }}
              slotProps={{
                toolbar: {
                  showQuickFilter: true,
                  quickFilterProps: { debounceMs: 500 },
                },
              }}
              sx={{
                border: 'none',
                '& .MuiDataGrid-main': {
                  minHeight: '400px',
                },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: theme.palette.primary.main,
                  color: 'white',
                  fontWeight: 600,
                },
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: theme.palette.action.hover,
                },
                '& .MuiDataGrid-virtualScroller': {
                  overflowX: 'hidden', // remove horizontal scroll if not needed
                },
                '& .MuiDataGrid-cell': {
                  padding: '8px 16px', // consistent padding
                },
                fontFamily: theme.typography.fontFamily,
              }}
            />
          </Paper>
        </Box>

        <Footer />
      </Box>
    </Box>
  );
};

export default AdminUsers;