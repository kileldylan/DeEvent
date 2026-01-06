import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Grid,
  useTheme,
  useMediaQuery,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Link,
  Stepper,
  Step,
  StepLabel,
  ToggleButton,
  ToggleButtonGroup,
  Radio,
  RadioGroup,
  FormLabel,
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  Email as EmailIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  LocationCity,
  Event as EventIcon,
  LocationOn,
  People,
  CalendarMonth,
  ArrowBack,
  CheckCircle,
  Home as HomeIcon,
  Apartment as ApartmentIcon,
} from '@mui/icons-material';
import axios from 'axios';

const steps = ['User Type', 'Account Details', 'Personal Information', 'Complete'];

const userTypes = [
  {
    value: 'personal',
    label: 'Personal',
    description: 'For individuals attending events',
    icon: <PersonIcon />,
  },
  {
    value: 'artist',
    label: 'Artist/Creator',
    description: 'Musicians, podcasters, content creators',
    icon: <EventIcon />,
  },
  {
    value: 'organizer',
    label: 'Event Organizer',
    description: 'For hosting your own events',
    icon: <BusinessIcon />,
  },
];

const counties = [
  'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Kisii',
  'Meru', 'Nyeri', 'Machakos', 'Kiambu', 'Kitale', 'Kakamega', 'Bungoma'
];

const Register = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    // User Type
    user_type: 'personal',
    is_organizer: false,
    
    // Account details
    email: '',
    password: '',
    password2: '',
    
    // Personal information
    first_name: '',
    last_name: '',
    phone: '',
    country: 'KE',
    city: '',
    county: '',
    agreedToTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const validateStep = (step) => {
    const errors = {};
    
    if (step === 0) {
      if (!formData.user_type) errors.user_type = 'Please select a user type';
    }
    
    if (step === 1) {
      if (!formData.email) errors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Email is invalid';
      
      if (!formData.password) errors.password = 'Password is required';
      else if (formData.password.length < 8) errors.password = 'Password must be at least 8 characters';
      
      if (!formData.password2) errors.password2 = 'Please confirm your password';
      else if (formData.password !== formData.password2) errors.password2 = 'Passwords do not match';
    }
    
    if (step === 2) {
      if (!formData.first_name) errors.first_name = 'First name is required';
      if (!formData.last_name) errors.last_name = 'Last name is required';
      if (!formData.phone) errors.phone = 'Phone number is required';
      
      // Format phone validation
      if (formData.phone) {
        const phone = formData.phone.trim();
        if (!/^(?:\+254|0|7|1)/.test(phone)) {
          errors.phone = 'Enter a valid Kenyan phone number';
        } else if (phone.length < 10) {
          errors.phone = 'Phone number too short';
        }
      }
      
      if (!formData.agreedToTerms) errors.agreedToTerms = 'You must agree to the terms and conditions';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      if (activeStep === steps.length - 1) {
        handleSubmit();
      } else {
        setActiveStep((prevStep) => prevStep + 1);
      }
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleUserTypeChange = (event) => {
    const userType = event.target.value;
    const isOrganizer = userType === 'organizer';
    
    setFormData(prev => ({
      ...prev,
      user_type: userType,
      is_organizer: isOrganizer,
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const formatPhoneNumber = (phone) => {
    let formatted = phone.trim();
    
    // Remove any spaces, dashes, parentheses
    formatted = formatted.replace(/[\s\-()]/g, '');
    
    // Convert to E.164 format
    if (formatted.startsWith('0') && formatted.length === 10) {
      formatted = '+254' + formatted.substring(1);
    } else if (formatted.startsWith('7') && formatted.length === 9) {
      formatted = '+254' + formatted;
    } else if (formatted.startsWith('254') && formatted.length === 12) {
      formatted = '+' + formatted;
    } else if (formatted.startsWith('1') && formatted.length === 10) {
      formatted = '+254' + formatted.substring(1);
    }
    
    return formatted;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Prepare data for API
      const { agreedToTerms, user_type, ...apiData } = formData;
      
      // Format phone number
      if (apiData.phone) {
        apiData.phone = formatPhoneNumber(apiData.phone);
      }
      
      // Set country to Kenya by default
      if (!apiData.country) {
        apiData.country = 'KE';
      }

      console.log('Sending registration data:', apiData);
      
      const response = await axios.post('http://localhost:8000/api/auth/register/', apiData);
      
      const { access, refresh, user, message } = response.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(user));
      
      setSuccess(`${message} Redirecting to dashboard...`);
      
      // Redirect based on user type
      setTimeout(() => {
        if (user.is_organizer) {
          navigate('/dashboard/organizer');
        } else {
          navigate('/dashboard');
        }
      }, 2000);
      
    } catch (err) {
      console.error('Registration error:', err.response?.data || err);
      
      // Handle different error formats from backend
      if (err.response?.data) {
        if (err.response.data.email) {
          setError(`Email: ${Array.isArray(err.response.data.email) ? err.response.data.email[0] : err.response.data.email}`);
        } else if (err.response.data.phone) {
          setError(`Phone: ${Array.isArray(err.response.data.phone) ? err.response.data.phone[0] : err.response.data.phone}`);
        } else if (err.response.data.detail) {
          setError(err.response.data.detail);
        } else if (err.response.data.error) {
          setError(err.response.data.error);
        } else if (typeof err.response.data === 'object') {
          // Handle field-specific errors
          const fieldErrors = Object.entries(err.response.data)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages[0] : messages}`)
            .join(', ');
          setError(fieldErrors || 'Registration failed. Please check your data.');
        } else {
          setError('Registration failed. Please try again.');
        }
      } else {
        setError('Network error. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0: // User Type
        return (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              How do you plan to use DeEvent?
            </Typography>
            
            <FormControl component="fieldset" sx={{ width: '100%' }}>
              <RadioGroup
                name="user_type"
                value={formData.user_type}
                onChange={handleUserTypeChange}
                sx={{ gap: 2 }}
              >
                {userTypes.map((type) => (
                  <Paper
                    key={type.value}
                    elevation={formData.user_type === type.value ? 4 : 0}
                    sx={{
                      p: 3,
                      borderRadius: 2,
                      border: `2px solid ${formData.user_type === type.value ? theme.palette.primary.main : '#e0e0e0'}`,
                      backgroundColor: formData.user_type === type.value ? '#f0f9ff' : 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: theme.palette.primary.light,
                        backgroundColor: '#f8f9fa',
                      },
                    }}
                    onClick={() => handleUserTypeChange({ target: { value: type.value } })}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Box sx={{ 
                        color: formData.user_type === type.value ? 'primary.main' : 'text.secondary',
                        mt: 0.5
                      }}>
                        {type.icon}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Radio 
                            value={type.value}
                            checked={formData.user_type === type.value}
                            sx={{ p: 0, mr: 1 }}
                          />
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {type.label}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                          {type.description}
                        </Typography>
                        {type.value === 'organizer' && (
                          <Alert severity="info" sx={{ mt: 2, fontSize: '0.875rem' }}>
                            Organizers can create and manage events, sell tickets, and access analytics
                          </Alert>
                        )}
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </RadioGroup>
            </FormControl>
            
            {formData.user_type === 'organizer' && (
              <Alert severity="info" sx={{ mt: 3, borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>Note:</strong> As an organizer, you'll need to complete KYC verification 
                  before hosting paid events. You can do this after registration in your dashboard.
                </Typography>
              </Alert>
            )}
          </Box>
        );
      
      case 1: // Account Details
        return (
          <Box sx={{ mt: 3 }}>
            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              variant="outlined"
              margin="normal"
              value={formData.email}
              onChange={handleChange}
              error={!!validationErrors.email}
              helperText={validationErrors.email}
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
              name="password"
              type={showPassword ? 'text' : 'password'}
              variant="outlined"
              margin="normal"
              value={formData.password}
              onChange={handleChange}
              error={!!validationErrors.password}
              helperText={validationErrors.password || 'Minimum 8 characters with letters and numbers'}
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
            
            <TextField
              fullWidth
              label="Confirm Password"
              name="password2"
              type={showConfirmPassword ? 'text' : 'password'}
              variant="outlined"
              margin="normal"
              value={formData.password2}
              onChange={handleChange}
              error={!!validationErrors.password2}
              helperText={validationErrors.password2}
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
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        );
      
      case 2: // Personal Information
        return (
          <Box sx={{ mt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="first_name"
                  variant="outlined"
                  margin="normal"
                  value={formData.first_name}
                  onChange={handleChange}
                  error={!!validationErrors.first_name}
                  helperText={validationErrors.first_name}
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  name="last_name"
                  variant="outlined"
                  margin="normal"
                  value={formData.last_name}
                  onChange={handleChange}
                  error={!!validationErrors.last_name}
                  helperText={validationErrors.last_name}
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
            
            <TextField
              fullWidth
              label="Phone Number"
              name="phone"
              variant="outlined"
              margin="normal"
              value={formData.phone}
              onChange={handleChange}
              error={!!validationErrors.phone}
              helperText={validationErrors.phone || 'Format: 0712345678 or +254712345678'}
              placeholder="0712345678"
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="City/Town"
                  name="city"
                  variant="outlined"
                  margin="normal"
                  value={formData.city}
                  onChange={handleChange}
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationCity color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>County</InputLabel>
                  <Select
                    name="county"
                    value={formData.county}
                    onChange={handleChange}
                    label="County"
                  >
                    <MenuItem value="">Select County</MenuItem>
                    {counties.map((county) => (
                      <MenuItem key={county} value={county}>
                        {county}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            
            <FormControlLabel
              control={
                <Checkbox
                  name="agreedToTerms"
                  checked={formData.agreedToTerms}
                  onChange={handleChange}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2">
                  I agree to the{' '}
                  <Link href="/terms" underline="hover" target="_blank">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" underline="hover" target="_blank">
                    Privacy Policy
                  </Link>
                </Typography>
              }
              sx={{ mt: 2 }}
            />
            {validationErrors.agreedToTerms && (
              <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                {validationErrors.agreedToTerms}
              </Typography>
            )}
          </Box>
        );
      
      case 3: // Complete
        return (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <CheckCircle 
              sx={{ 
                fontSize: 80, 
                color: theme.palette.success.main,
                mb: 3 
              }} 
            />
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Review Your Information
            </Typography>
            <Paper sx={{ p: 3, mb: 3, background: '#f8f9fa', textAlign: 'left' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                {userTypes.find(t => t.value === formData.user_type)?.icon}
                <Typography variant="subtitle1" sx={{ ml: 1, fontWeight: 600 }}>
                  {userTypes.find(t => t.value === formData.user_type)?.label} Account
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                <strong>Email:</strong> {formData.email}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                <strong>Name:</strong> {formData.first_name} {formData.last_name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                <strong>Phone:</strong> {formatPhoneNumber(formData.phone)}
              </Typography>
              {formData.city && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>Location:</strong> {formData.city}{formData.county ? `, ${formData.county} County` : ''}
                </Typography>
              )}
            </Paper>
            
            {formData.user_type === 'organizer' && (
              <Alert severity="info" sx={{ mb: 3, borderRadius: 1 }}>
                <Typography variant="body2">
                  As an organizer, you'll need to verify your identity (KYC) before hosting events.
                  This can be done in your dashboard after registration.
                </Typography>
              </Alert>
            )}
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Click "Complete Registration" to create your account
            </Typography>
          </Box>
        );
      
      default:
        return null;
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
                Join Kenya's Premier Event Platform
              </Typography>

              {/* Features list */}
              <Box sx={{ mt: 6, textAlign: 'left' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <LocationOn sx={{ mr: 2, fontSize: 30 }} />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Local Events</Typography>
                    <Typography>Access events across Kenya</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <People sx={{ mr: 2, fontSize: 30 }} />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Create & Sell</Typography>
                    <Typography>Host your own events easily</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CalendarMonth sx={{ mr: 2, fontSize: 30 }} />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Smart Ticketing</Typography>
                    <Typography>Digital tickets with M-Pesa</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Grid>
        )}

        {/* Right Side - Registration Form */}
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
            overflowY: 'auto',
          }}
        >
          <Paper
            elevation={0}
            sx={{
              width: '100%',
              maxWidth: 550,
              p: { xs: 3, md: 4 },
              borderRadius: 2,
              background: 'white',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            {/* Mobile logo */}
            {isMobile && (
              <Box sx={{ textAlign: 'center', mb: 3 }}>
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

            {/* Back button for mobile */}
            {isMobile && activeStep > 0 && (
              <Button
                startIcon={<ArrowBack />}
                onClick={handleBack}
                sx={{ mb: 2 }}
              >
                Back
              </Button>
            )}

            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 600,
                mb: 1,
                color: 'text.primary'
              }}
            >
              Create Account
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary" 
              sx={{ mb: 3 }}
            >
              Join thousands of event organizers and attendees
            </Typography>

            {/* Stepper */}
            {!isMobile && (
              <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            )}

            {isMobile && (
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
                {steps.map((_, index) => (
                  <Box
                    key={index}
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: index <= activeStep ? 'primary.main' : 'grey.300',
                      mx: 0.5,
                    }}
                  />
                ))}
              </Box>
            )}

            {/* Step Title */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {activeStep === 0 && 'Select Account Type'}
              {activeStep === 1 && 'Create Your Account'}
              {activeStep === 2 && 'Personal Information'}
              {activeStep === 3 && 'Review & Complete'}
            </Typography>

            {/* Error/Success Messages */}
            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 1 }}>
                {error}
              </Alert>
            )}
            
            {success && (
              <Alert severity="success" sx={{ mb: 3, borderRadius: 1 }}>
                {success}
              </Alert>
            )}

            {/* Step Content */}
            {getStepContent(activeStep)}

            {/* Navigation Buttons */}
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                onClick={handleBack}
                disabled={activeStep === 0 || loading}
                startIcon={<ArrowBack />}
                sx={{ visibility: activeStep === 0 ? 'hidden' : 'visible' }}
              >
                Back
              </Button>
              
              <Button
                onClick={handleNext}
                variant="contained"
                disabled={loading}
                sx={{ minWidth: 180 }}
              >
                {loading ? (
                  <CircularProgress size={24} sx={{ color: 'white' }} />
                ) : activeStep === steps.length - 1 ? (
                  'Complete Registration'
                ) : (
                  'Continue'
                )}
              </Button>
            </Box>

            {/* Login link */}
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link
                  component={RouterLink}
                  to="/login"
                  sx={{
                    color: 'primary.main',
                    fontWeight: 600,
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    }
                  }}
                >
                  Sign in here
                </Link>
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Register;