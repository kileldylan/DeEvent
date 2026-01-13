// src/pages/organizations/Organizations.jsx
import { useState } from 'react';
import {
  Box, Typography, Button, CircularProgress, Grid, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useOrganizations } from '../../hooks/useOrganization';
import OrganizationCard from '../../components/organizations/OrganizationCard';
import CreateOrgForm from '../../components/organizations/CreateOrgForm';

const Organizations = () => {
  const { ownedOrgs, memberOrgs, loading, error, createOrg, refresh } = useOrganizations();
  const [openCreate, setOpenCreate] = useState(false);
  const [createError, setCreateError] = useState(null);

  const handleCreate = async (formData) => {
    try {
      await createOrg(formData);
      setOpenCreate(false);
      setCreateError(null);
    } catch (err) {
      setCreateError(err.message);
    }
  };

  if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 10 }} />;

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          My Organizations
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreate(true)}
        >
          Create New Organization
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Owned Organizations */}
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        Owned by Me ({ownedOrgs.length})
      </Typography>
      {ownedOrgs.length === 0 ? (
        <Typography color="text.secondary">You don't own any organizations yet.</Typography>
      ) : (
        <Grid container spacing={3}>
          {ownedOrgs.map(org => (
            <Grid item xs={12} sm={6} md={4} key={org.id}>
              <OrganizationCard org={org} isOwned />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Member Of */}
      <Typography variant="h6" gutterBottom sx={{ mt: 6 }}>
        Member Of ({memberOrgs.length})
      </Typography>
      {memberOrgs.length === 0 ? (
        <Typography color="text.secondary">You're not a member of any other organizations.</Typography>
      ) : (
        <Grid container spacing={3}>
          {memberOrgs.map(org => (
            <Grid item xs={12} sm={6} md={4} key={org.id}>
              <OrganizationCard org={org} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Dialog */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Organization</DialogTitle>
        <DialogContent>
          {createError && <Alert severity="error" sx={{ mb: 2 }}>{createError}</Alert>}
          <CreateOrgForm onSubmit={handleCreate} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Organizations;