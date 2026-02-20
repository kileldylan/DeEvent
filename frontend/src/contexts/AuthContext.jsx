import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api/auth';
import { Box, CircularProgress } from '@mui/material';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Initial auth check (safe, no redirect here)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
        const storedUser = sessionStorage.getItem('user') || localStorage.getItem('user');

        if (token && storedUser) {
          try {
            // Try fresh fetch first
            const freshUser = await authAPI.getCurrentUser();
            console.log('Fresh user from /auth/profile/ or /auth/user/:', freshUser);
            const normalized = normalizeUser(freshUser);
            setUser(normalized);
            sessionStorage.setItem('user', JSON.stringify(normalized));
          } catch (err) {
            console.warn('Fresh fetch failed, using stored:', err);
            try {
              const parsed = JSON.parse(storedUser);
              setUser(normalizeUser(parsed));
            } catch (parseErr) {
              console.error('Stored user invalid:', parseErr);
              authAPI.logout();
            }
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        authAPI.logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Safe redirect helper
  const redirectBasedOnRole = (currentUser) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const isStaff = currentUser.is_staff ?? currentUser.isStaff ?? false;
    const isOrganizer = currentUser.is_organizer ?? currentUser.isOrganizer ?? false;
    const isSuperuser = currentUser.is_superuser ?? false;  // Add this check

    console.log('Role check:', { is_staff: isStaff, is_organizer: isOrganizer, is_superuser: isSuperuser });

    const path = window.location.pathname;

    // Skip if already on correct page
    if ((isSuperuser && path.startsWith('/admin')) ||
        (isOrganizer && !isSuperuser && path === '/organizations') ||
        (!isStaff && !isOrganizer && path === '/')) {
      console.log('Already on correct path - skipping redirect');
      return;
    }

    // Priority: superuser/admin first, then organizer, then default
    if (isSuperuser) {
      console.log('→ Admin dashboard');
      navigate('/admin-dashboard');
    } else if (isOrganizer) {
      console.log('→ Organizations');
      navigate('/org-dashboard');
    } else {
      console.log('→ Default /');
      navigate('/');
    }
  };

  // Normalize API user payload to consistent camelCase keys used across the app
  const normalizeUser = (u) => {
    if (!u) return null;
    return {
      id: u.id ?? u.user_id,
      email: u.email,
      firstName: u.first_name || u.firstName || u.given_name || u.first || '',
      lastName: u.last_name || u.lastName || u.family_name || u.last || '',
      fullName: u.full_name || u.fullName || `${u.first_name || u.firstName || ''} ${u.last_name || u.lastName || ''}`.trim(),
      avatar: u.avatar || u.profile_picture || u.avatar_url || u.picture || u.image || null,
      is_organizer: u.is_organizer ?? u.isOrganizer ?? false,
      is_organizer_bool: u.is_organizer ?? u.isOrganizer ?? false,
      is_staff: u.is_staff ?? u.isStaff ?? false,
      is_superuser: u.is_superuser ?? u.isSuperuser ?? false,
      is_verified: u.is_verified ?? u.isVerified ?? false,
      raw: u,
    };
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await authAPI.login(email, password);
      const loggedInUser = response.user;
      console.log('Login response user:', loggedInUser);
      const normalized = normalizeUser(loggedInUser);
      setUser(normalized);
      sessionStorage.setItem('user', JSON.stringify(normalized));
      redirectBasedOnRole(normalized);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Login failed',
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      await authAPI.register(userData);
      const loginResponse = await authAPI.login(userData.email, userData.password);
      const registeredUser = loginResponse.user;
      console.log('Register + auto-login user:', registeredUser);
      const normalized = normalizeUser(registeredUser);
      setUser(normalized);
      sessionStorage.setItem('user', JSON.stringify(normalized));
      redirectBasedOnRole(normalized);
      return { success: true };
    } catch (error) {
      console.error('Register error:', error);
      return {
        success: false,
        error: error.response?.data || 'Registration failed',
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
    navigate('/login');
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.is_staff || false,
    isOrganizer: user?.is_organizer || false,
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};