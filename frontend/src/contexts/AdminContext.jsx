// src/contexts/AdminContext.jsx
import React, { createContext, useState, useContext, useCallback } from 'react';
import axiosInstance from '../api/axiosConfig';

const AdminContext = createContext({});

export const useAdmin = () => useContext(AdminContext);

export const AdminProvider = ({ children }) => {
  const [organizations, setOrganizations] = useState([]);
  const [users, setUsers] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all organizations (admin view)
  const fetchOrganizations = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.org_type) params.append('org_type', filters.org_type);
      if (filters.search) params.append('search', filters.search);

      const response = await axiosInstance.get(`/admin/organizations/?${params.toString()}`);
      setOrganizations(response.data.results || response.data);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to fetch organizations';
      setError(errorMsg);
      console.error('Fetch organizations error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch platform/admin stats
  const fetchAdminStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(`/admin/stats/`);
      setAdminStats(response.data);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to fetch admin stats';
      setError(errorMsg);
      console.error('Fetch admin stats error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all users (admin view)
  const fetchUsers = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.is_organizer) params.append('is_organizer', filters.is_organizer);
      if (filters.search) params.append('search', filters.search);

      const response = await axiosInstance.get(`/admin/users/?${params.toString()}`);
      setUsers(response.data.results || response.data);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to fetch users';
      setError(errorMsg);
      console.error('Fetch users error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Approve organization
  const approveOrganization = useCallback(async (orgId) => {
    try {
      const response = await axiosInstance.post(`/admin/organizations/${orgId}/approve/`);
      // Update local state
      setOrganizations(prev => 
        prev.map(org => org.id === orgId ? response.data : org)
      );
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to approve organization';
      setError(errorMsg);
      throw err;
    }
  }, []);

  // Suspend organization
  const suspendOrganization = useCallback(async (orgId, reason = '') => {
    try {
      const response = await axiosInstance.post(`/admin/organizations/${orgId}/suspend/`, { reason });
      setOrganizations(prev => 
        prev.map(org => org.id === orgId ? response.data : org)
      );
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to suspend organization';
      setError(errorMsg);
      throw err;
    }
  }, []);

  // Activate organization
  const activateOrganization = useCallback(async (orgId) => {
    try {
      const response = await axiosInstance.post(`/admin/organizations/${orgId}/activate/`);
      setOrganizations(prev => 
        prev.map(org => org.id === orgId ? response.data : org)
      );
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to activate organization';
      setError(errorMsg);
      throw err;
    }
  }, []);

  // Deactivate user
  const deactivateUser = useCallback(async (userId) => {
    try {
      const response = await axiosInstance.patch(`/admin/users/${userId}/`, { is_active: false });
      setUsers(prev => 
        prev.map(user => user.id === userId ? response.data : user)
      );
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to deactivate user';
      setError(errorMsg);
      throw err;
    }
  }, []);

  // Delete user
  const deleteUser = useCallback(async (userId) => {
    try {
      await axiosInstance.delete(`/admin/users/${userId}/`);
      setUsers(prev => prev.filter(user => user.id !== userId));
      return true;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to delete user';
      setError(errorMsg);
      throw err;
    }
  }, []);

  const value = {
    organizations,
    users,
    adminStats,
    loading,
    error,
    fetchOrganizations,
    fetchUsers,
    fetchAdminStats,
    approveOrganization,
    suspendOrganization,
    activateOrganization,
    deactivateUser,
    deleteUser,
    clearError: () => setError(null),
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};
