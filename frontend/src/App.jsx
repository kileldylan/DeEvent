// App.jsx or main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Container, Box, Typography, Button } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AdminProvider } from './contexts/AdminContext';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOrganizations from './pages/admin/AdminOrganizations';
import AdminUsersManagement from './pages/admin/AdminUsersManagement';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import OrganizerDashboard from './pages/organizations/Organizations';
import AdminUsers from './pages/admin/AdminUsers';
import OrganizationsDashboard from './pages/organizations/OrganizationsDashboard';
import Organizations from './pages/organizations/Organizations';
import { OrganizationsProvider } from './contexts/OrganizationsContext';

// Protected Route Component
  const ProtectedRoute = ({ children, roles = [] }) => {
    const { isAuthenticated, user, loading } = useAuth();

    if (loading) return <div>Loading...</div>;

    if (!isAuthenticated) return <Navigate to="/login" replace />;

    if (roles.length > 0) {
      const hasRole = roles.some(role => {
        if (role === 'admin') return user?.is_staff === true;
        if (role === 'organizer') return user?.is_organizer === true;
        if (role === 'verified') return user?.is_verified === true;
        return false;
      });

      if (!hasRole) {
        return <Navigate to="/unauthorized" replace />;
      }
    }

    return children;
  };

// Main App Component
const App = () => {
  return (
    <Router>
      <AuthProvider>
        <AdminProvider>
          <OrganizationsProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <OrganizationsDashboard />
            </ProtectedRoute>
          } />
          
          {/* Admin ROutes */}
          <Route path="/admin-dashboard" element={
            <ProtectedRoute roles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          <Route
            path="/admin/organizations"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminOrganizations />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users-management"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminUsersManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminAnalytics />
              </ProtectedRoute>
            }
          />
          
          <Route path="/organizations" element={
            <ProtectedRoute roles={['organizer']}>
              <OrganizerDashboard />
            </ProtectedRoute>
          } />

          <Route path="/org-dashboard" element={
            <ProtectedRoute roles={['organizer']}>
              <OrganizationsDashboard />
            </ProtectedRoute>
          } />

          {/* Specific organizer pages (defined before wildcard) */}
          <Route path="/organizer/organizations" element={
            <ProtectedRoute roles={['organizer']}>
              <Organizations />
            </ProtectedRoute>
          } />
          {/* Support legacy organizer routes used by Sidebar (catch-all) */}
          <Route path="/organizer/*" element={
            <ProtectedRoute roles={['organizer']}>
              <OrganizationsDashboard />
            </ProtectedRoute>
          } />
          
          {/* Unauthorized route */}
          <Route path="/unauthorized" element={
            <Container maxWidth="sm">
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <Typography variant="h4" gutterBottom>
                  Access Denied
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  You don't have permission to access this page.
                </Typography>
                <Button variant="contained" onClick={() => window.location.href = '/'}>
                  Go to Dashboard
                </Button>
              </Box>
            </Container>
          } />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
          </OrganizationsProvider>
        </AdminProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;