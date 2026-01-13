// src/hooks/useOrganizations.js
import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig'; // your axios file

export const useOrganizations = () => {
  const [ownedOrgs, setOwnedOrgs] = useState([]);
  const [memberOrgs, setMemberOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrgs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosInstance.get('/organizations/my-organizations/');
      setOwnedOrgs(res.data.owned || []);
      setMemberOrgs(res.data.member_of || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load organizations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createOrg = async (data) => {
    try {
      const res = await axiosInstance.post('/organizations/', data);
      // Refresh list after create
      await fetchOrgs();
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.detail || 'Failed to create organization');
    }
  };

  const updateOrg = async (orgId, data) => {
    try {
      const res = await axiosInstance.patch(`/organizations/${orgId}/`, data);
      await fetchOrgs();
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.detail || 'Failed to update');
    }
  };

  const inviteMember = async (orgId, { email, role }) => {
    try {
      const res = await axiosInstance.post(`/organizations/${orgId}/invite_member/`, { email, role });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.detail || 'Failed to invite');
    }
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  return {
    ownedOrgs,
    memberOrgs,
    loading,
    error,
    createOrg,
    updateOrg,
    inviteMember,
    refresh: fetchOrgs,
  };
};