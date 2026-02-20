// src/components/layout/Footer.jsx
import { Box, Typography, Link, IconButton, Stack } from '@mui/material';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: { xs: 2, md: 4 },
        bgcolor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
        }}
      >
        {/* Left: Copyright */}
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} DeEvent. All rights reserved.
        </Typography>

        {/* Center: Links */}
        <Stack direction="row" spacing={2}>
          <Link href="/privacy" color="text.secondary" underline="hover" sx={{ fontSize: '0.875rem' }}>
            Privacy Policy
          </Link>
          <Link href="/terms" color="text.secondary" underline="hover" sx={{ fontSize: '0.875rem' }}>
            Terms of Service
          </Link>
          <Link href="/contact" color="text.secondary" underline="hover" sx={{ fontSize: '0.875rem' }}>
            Contact Us
          </Link>
          <Link href="/help" color="text.secondary" underline="hover" sx={{ fontSize: '0.875rem' }}>
            Help Center
          </Link>
        </Stack>

        {/* Right: Social Links */}
        <Stack direction="row" spacing={1}>
          <IconButton size="small" href="https://twitter.com" target="_blank">
            <TwitterIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" href="https://linkedin.com" target="_blank">
            <LinkedInIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" href="https://github.com" target="_blank">
            <GitHubIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Box>
    </Box>
  );
};

export default Footer;