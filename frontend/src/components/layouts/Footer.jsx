// src/components/layout/Footer.jsx
// Simple reusable footer with copyright + links

import { Box, Typography, Link } from '@mui/material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 4,
        mt: 'auto',
        bgcolor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
      }}
    >
      <Typography variant="body2" color="text.secondary" align="center">
        © {new Date().getFullYear()} DeEvent. All rights reserved.
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 1 }}>
        <Link href="/privacy" color="inherit" underline="hover">Privacy Policy</Link>
        <Link href="/terms" color="inherit" underline="hover">Terms of Service</Link>
        <Link href="/contact" color="inherit" underline="hover">Contact Us</Link>
      </Box>
    </Box>
  );
};

export default Footer;