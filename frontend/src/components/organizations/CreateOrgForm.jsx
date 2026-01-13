// src/components/organizations/CreateOrgForm.jsx
import { useState } from 'react';
import {
  TextField, Select, MenuItem, FormControl, InputLabel,
  FormHelperText, Box, Button
} from '@mui/material';

const CreateOrgForm = ({ onSubmit }) => {
  const [form, setForm] = useState({
    name: '',
    org_type: 'personal',
    email: '',
    phone: '',
    description: '',
    // Add more fields for business: tax_id, address, etc.
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (form.org_type === 'business') {
      if (!form.email) newErrors.email = 'Email is required for business';
      // Add more business validations
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit(form);
    }
  };

  return (
    <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
      <TextField
        label="Organization Name"
        name="name"
        value={form.name}
        onChange={handleChange}
        error={!!errors.name}
        helperText={errors.name}
        fullWidth
        required
      />

      <FormControl fullWidth>
        <InputLabel>Type</InputLabel>
        <Select
          name="org_type"
          value={form.org_type}
          label="Type"
          onChange={handleChange}
        >
          <MenuItem value="personal">Personal / Artist</MenuItem>
          <MenuItem value="business">Business / Agency</MenuItem>
        </Select>
      </FormControl>

      <TextField
        label="Email"
        name="email"
        type="email"
        value={form.email}
        onChange={handleChange}
        error={!!errors.email}
        helperText={errors.email || (form.org_type === 'business' ? 'Required for business organizations' : '')}
        fullWidth
      />

      <TextField
        label="Phone (+254...)"
        name="phone"
        value={form.phone}
        onChange={handleChange}
        fullWidth
      />

      <TextField
        label="Description"
        name="description"
        value={form.description}
        onChange={handleChange}
        multiline
        rows={4}
        fullWidth
      />

      {/* Add more fields conditionally for business: tax_id, address, etc. */}

      <Button
        variant="contained"
        color="primary"
        onClick={handleSubmit}
        sx={{ mt: 2 }}
      >
        Create Organization
      </Button>
    </Box>
  );
};

export default CreateOrgForm;