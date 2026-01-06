import axiosInstance from './axiosConfig';

export const organizationAPI = {
  // Get all organizations for current user
  getOrganizations: async () => {
    const response = await axiosInstance.get('/organizations/');
    return response.data;
  },

  // Create new organization
  createOrganization: async (organizationData) => {
    const response = await axiosInstance.post('/organizations/', organizationData);
    return response.data;
  },

  // Get organization by ID
  getOrganizationById: async (id) => {
    const response = await axiosInstance.get(`/organizations/${id}/`);
    return response.data;
  },

  // Update organization
  updateOrganization: async (id, data) => {
    const response = await axiosInstance.patch(`/organizations/${id}/`, data);
    return response.data;
  },

  // Delete organization
  deleteOrganization: async (id) => {
    await axiosInstance.delete(`/organizations/${id}/`);
  },

  // Get my organizations (owned vs member)
  getMyOrganizations: async () => {
    const response = await axiosInstance.get('/organizations/my-organizations/');
    return response.data;
  },
};