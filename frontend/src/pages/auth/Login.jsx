import React, { useState } from 'react';
import { useNavigate, Link as RouterLink} from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Link,
  Button,
  Paper,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Grid,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  Email as EmailIcon,
  Lock as LockIcon,
  Event as EventIcon,
  LocationOn,
  People,
  CalendarMonth
} from '@mui/icons-material';
import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:8000/api/v1/auth/login/', {
        email,
        password,
      });

      const { access, refresh, user } = response.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(user));

      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth={false} disableGutters sx={{ height: '100vh' }}>
      <Grid container sx={{ height: '100%' }}>
        {/* Left Side - Branding/Image */}
        {!isMobile && (
          <Grid 
            item 
            md={6} 
            sx={{
              background: 'linear-gradient(135deg, #006400 0%, #1b5e20 100%)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              color: 'white',
              p: 8,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Decorative elements */}
            <Box
              sx={{
                position: 'absolute',
                top: -100,
                right: -100,
                width: 300,
                height: 300,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: -50,
                left: -50,
                width: 200,
                height: 200,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
              }}
            />

            <Box sx={{ zIndex: 1, textAlign: 'center', maxWidth: 500 }}>
              <EventIcon 
                sx={{ 
                  fontSize: 80, 
                  mb: 3,
                  filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.2))'
                }} 
              />
              <Typography 
                variant="h2" 
                sx={{ 
                  fontWeight: 800,
                  mb: 2,
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                }}
              >
                DeEvent
              </Typography>
              <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
                Transform Your Event Experience
              </Typography>

              {/* Features list */}
              <Box sx={{ mt: 6, textAlign: 'left' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <LocationOn sx={{ mr: 2, fontSize: 30 }} />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Kenyan Events</Typography>
                    <Typography>From Nairobi to Mombasa</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <People sx={{ mr: 2, fontSize: 30 }} />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Community Focused</Typography>
                    <Typography>Built for Kenyan creators</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CalendarMonth sx={{ mr: 2, fontSize: 30 }} />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Easy Management</Typography>
                    <Typography>Simple event creation & ticketing</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Grid>
        )}

        {/* Right Side - Login Form */}
        <Grid 
          item 
          xs={12} 
          md={6} 
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: { xs: 3, md: 8 },
            background: '#f8f9fa',
          }}
        >
          <Paper
            elevation={0}
            sx={{
              width: '100%',
              maxWidth: 450,
              p: { xs: 3, md: 5 },
              borderRadius: 2,
              background: 'white',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            {/* Mobile logo */}
            {isMobile && (
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <EventIcon 
                  sx={{ 
                    fontSize: 50, 
                    color: 'primary.main',
                    mb: 1 
                  }} 
                />
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 800,
                    color: 'primary.main',
                  }}
                >
                  DeEvent
                </Typography>
              </Box>
            )}

            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 600,
                mb: 1,
                color: 'text.primary'
              }}
            >
              Welcome Back
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary" 
              sx={{ mb: 4 }}
            >
              Sign in to your account
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 1 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email Address"
                variant="outlined"
                margin="normal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                margin="normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  mt: 3,
                  py: 1.5,
                  borderRadius: 1,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                }}
              >
                {loading ? (
                  <CircularProgress size={24} sx={{ color: 'white' }} />
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Register link */}
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <Link
                  component={RouterLink}
                  to="/register"
                  sx={{
                    color: 'primary.main',
                    fontWeight: 600,
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    }
                  }}
                >
                  Sign up here
                </Link>
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Login;