// src/layouts/AdminLayout.jsx
import React, { useState } from 'react';
import { Box } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';

const AdminLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex' }}>
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

      {/* Main content */}
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Header onMenuToggle={handleDrawerToggle} />
        <Box sx={{ p: { xs: 2, md: 4 }, pt: { xs: 10, md: 12 } }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default AdminLayout;