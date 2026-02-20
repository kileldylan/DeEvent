// src/contexts/OrganizationsContext.jsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosConfig';

const OrganizationsContext = createContext({}); // FIXED: Changed from OrganizationContext to OrganizationsContext

export const useOrganizations = () => useContext(OrganizationsContext);

export const OrganizationsProvider = ({ children }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [currentOrganization, setCurrentOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch user's organizations
  const fetchOrganizations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get('/org/my-organizations/');
      setOrganizations({
        owned: response.data.owned || [],
        member_of: response.data.member_of || []
      });
      
      // Set first organization as current if available
      if (response.data.owned.length > 0) {
        setCurrentOrganization(response.data.owned[0]);
      } else if (response.data.member_of.length > 0) {
        setCurrentOrganization(response.data.member_of[0]);
      }
    } catch (err) {
      console.error('Failed to fetch organizations:', err);
      setError('Failed to load organizations');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch dashboard data for current organization
  const fetchDashboardData = useCallback(async (orgId = null) => {
    setLoading(true);
    setError(null);
    try {
      let url = '/org/organizations/dashboard/';
      if (orgId) {
        url = `/org/organizations/organizations/${orgId}/dashboard/`;
      }
      
      const response = await axiosInstance.get(url);
      setDashboardData(response.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch quick stats
  const fetchQuickStats = useCallback(async (orgId = null) => {
    try {
      let url = '/org/organizations/quick-stats/';
      if (orgId) {
        url = `/org/organizations/organizations/${orgId}/quick-stats/`;
      }
      
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (err) {
      console.error('Failed to fetch quick stats:', err);
      throw err;
    }
  }, []);

  // Set current organization
  const setOrganization = useCallback((org) => {
    setCurrentOrganization(org);
    if (org?.id) {
      fetchDashboardData(org.id);
    }
  }, [fetchDashboardData]);

  // Create new organization
  const createOrganization = async (orgData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.post('/org/organizations/', orgData);
      const newOrg = response.data;
      
      // Update organizations list
      setOrganizations(prev => ({
        ...prev,
        owned: [newOrg, ...prev.owned]
      }));
      
      // Set as current organization
      setCurrentOrganization(newOrg);
      
      return { success: true, organization: newOrg };
    } catch (err) {
      const errorMsg = err.response?.data || 'Failed to create organization';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Update organization
  const updateOrganization = async (orgId, data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.patch(`/org/organizations/organizations/${orgId}/`, data);
      const updatedOrg = response.data;
      
      // Update in organizations list
      setOrganizations(prev => ({
        owned: prev.owned.map(org => org.id === orgId ? updatedOrg : org),
        member_of: prev.member_of
      }));
      
      // Update current if it's the one being updated
      if (currentOrganization?.id === orgId) {
        setCurrentOrganization(updatedOrg);
      }
      
      return { success: true, organization: updatedOrg };
    } catch (err) {
      const errorMsg = err.response?.data || 'Failed to update organization';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Fetch organization events
  const fetchOrganizationEvents = useCallback(async (orgId) => {
    try {
      const response = await axiosInstance.get(`/org/organizations/organizations/${orgId}/events/`);
      return response.data;
    } catch (err) {
      console.error('Failed to fetch organization events:', err);
      throw err;
    }
  }, []);

  // Fetch organization transactions
  const fetchOrganizationTransactions = useCallback(async (orgId) => {
    try {
      const response = await axiosInstance.get(`/org/organizations/organizations/${orgId}/transactions/`);
      return response.data;
    } catch (err) {
      console.error('Failed to fetch organization transactions:', err);
      throw err;
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  // Fetch dashboard data when organization changes
  useEffect(() => {
    if (currentOrganization) {
      fetchDashboardData(currentOrganization.id);
    }
  }, [currentOrganization, fetchDashboardData]);

  const value = {
    dashboardData,
    organizations,
    currentOrganization,
    loading,
    error,
    setOrganization,
    createOrganization,
    updateOrganization,
    fetchDashboardData,
    fetchQuickStats,
    fetchOrganizationEvents,
    fetchOrganizationTransactions,
    refreshOrganizations: fetchOrganizations,
    clearError: () => setError(null),
  };

  return (
    <OrganizationsContext.Provider value={value}>
      {children}
    </OrganizationsContext.Provider>
  );
};