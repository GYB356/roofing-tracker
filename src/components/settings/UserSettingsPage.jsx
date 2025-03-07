// components/settings/UserSettingsPage.jsx
import React, { useState, useEffect } from 'react';
import { Tabs, Tab, Box, Paper, Container } from '@mui/material';
import ProfileSettings from './ProfileSettings';
import SecuritySettings from './SecuritySettings';
import PreferencesSettings from './PreferencesSettings';
import { getUserSettings } from '../../services/userSettingsService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';

const UserSettingsPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await getUserSettings();
        setSettings(data);
        setError(null);
      } catch (err) {
        setError('Failed to load user settings. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            variant="fullWidth"
          >
            <Tab label="Profile" />
            <Tab label="Security" />
            <Tab label="Preferences" />
          </Tabs>
        </Box>
        <Box sx={{ p: 3 }}>
          {activeTab === 0 && <ProfileSettings settings={settings} setSettings={setSettings} />}
          {activeTab === 1 && <SecuritySettings />}
          {activeTab === 2 && <PreferencesSettings settings={settings} setSettings={setSettings} />}
        </Box>
      </Paper>
    </Container>
  );
};

export default UserSettingsPage;

// components/settings/ProfileSettings.jsx
import React, { useState } from 'react';
import { Box, TextField, Button, Grid, Avatar, Typography, Snackbar, Alert } from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';
import { updateProfile, uploadProfileImage } from '../../services/userSettingsService';

const ProfileSettings = ({ settings, setSettings }) => {
  const [formData, setFormData] = useState({
    firstName: settings?.profile?.firstName || '',
    lastName: settings?.profile?.lastName || '',
    phoneNumber: settings?.profile?.phoneNumber || '',
    jobTitle: settings?.profile?.jobTitle || ''
  });
  
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const updatedSettings = await updateProfile(formData);
      setSettings({
        ...settings,
        profile: updatedSettings.profile
      });
      setStatus({
        type: 'success',
        message: 'Profile updated successfully!'
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Failed to update profile. Please try again.'
      });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = async (e) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('profileImage', file);
    
    try {
      setIsSubmitting(true);
      const { imageUrl, settings: updatedSettings } = await uploadProfileImage(formData);
      setSettings(updatedSettings);
      setStatus({
        type: 'success',
        message: 'Profile image updated successfully!'
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Failed to upload image. Please try again.'
      });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSnackbar = () => {
    setStatus({ type: '', message: '' });
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Grid container spacing={3}>
        <Grid item xs={12} display="flex" flexDirection="column" alignItems="center" mb={2}>
          <Avatar
            src={settings?.profile?.profileImage || ''}
            alt="Profile"
            sx={{ width: 100, height: 100, mb: 2 }}
          />
          <Button
            variant="outlined"
            component="label"
            startIcon={<PhotoCamera />}
            disabled={isSubmitting}
          >
            Change Photo
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleImageUpload}
            />
          </Button>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="First Name"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Last Name"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Phone Number"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Job Title"
            name="jobTitle"
            value={formData.jobTitle}
            onChange={handleChange}
          />
        </Grid>
        
        <Grid item xs={12} display="flex" justifyContent="flex-end">
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isSubmitting}
          >
            Save Changes
          </Button>
        </Grid>
      </Grid>
      
      <Snackbar
        open={!!status.message}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={status.type} 
          sx={{ width: '100%' }}
        >
          {status.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProfileSettings;

// components/settings/SecuritySettings.jsx
import React, { useState } from 'react';
import { Box, TextField, Button, Grid, Typography, Snackbar, Alert } from '@mui/material';
import { changePassword } from '../../services/userSettingsService';

const SecuritySettings = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    
    // Clear validation errors when typing
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: null
      });
    }
    
    // Clear password mismatch error when typing in either password field
    if (e.target.name === 'newPassword' || e.target.name === 'confirmPassword') {
      if (errors.passwordMatch) {
        setErrors({
          ...errors,
          passwordMatch: null
        });
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.passwordMatch = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      await changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      
      // Reset form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setStatus({
        type: 'success',
        message: 'Password changed successfully!'
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.response?.data?.message || 'Failed to change password. Please try again.'
      });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSnackbar = () => {
    setStatus({ type: '', message: '' });
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h6" gutterBottom>
        Change Password
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Current Password"
            name="currentPassword"
            type="password"
            value={formData.currentPassword}
            onChange={handleChange}
            error={!!errors.currentPassword}
            helperText={errors.currentPassword}
            required
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="New Password"
            name="newPassword"
            type="password"
            value={formData.newPassword}
            onChange={handleChange}
            error={!!errors.newPassword}
            helperText={errors.newPassword}
            required
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Confirm New Password"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={!!errors.confirmPassword || !!errors.passwordMatch}
            helperText={errors.confirmPassword || errors.passwordMatch}
            required
          />
        </Grid>
        
        <Grid item xs={12} display="flex" justifyContent="flex-end">
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isSubmitting}
          >
            Update Password
          </Button>
        </Grid>
      </Grid>
      
      <Snackbar
        open={!!status.message}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={status.type} 
          sx={{ width: '100%' }}
        >
          {status.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SecuritySettings;

// components/settings/PreferencesSettings.jsx
import React, { useState } from 'react';
import { 
  Box, 
  FormControl,
  FormGroup,
  FormControlLabel,
  Switch,
  Typography,
  Button,
  Grid,
  Divider,
  FormLabel,
  RadioGroup,
  Radio,
  Snackbar,
  Alert
} from '@mui/material';
import { updatePreferences } from '../../services/userSettingsService';

const PreferencesSettings = ({ settings, setSettings }) => {
  const [preferences, setPreferences] = useState(settings?.preferences || {
    notifications: {
      email: true,
      inApp: true,
      sms: false
    },
    dashboard: {
      showWeather: true,
      showUpcomingProjects: true,
      showInventoryAlerts: true
    },
    theme: 'system'
  });
  
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNotificationChange = (event) => {
    setPreferences({
      ...preferences,
      notifications: {
        ...preferences.notifications,
        [event.target.name]: event.target.checked
      }
    });
  };

  const handleDashboardChange = (event) => {
    setPreferences({
      ...preferences,
      dashboard: {
        ...preferences.dashboard,
        [event.target.name]: event.target.checked
      }
    });
  };

  const handleThemeChange = (event) => {
    setPreferences({
      ...preferences,
      theme: event.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const updatedSettings = await updatePreferences(preferences);
      setSettings({
        ...settings,
        preferences: updatedSettings.preferences
      });
      setStatus({
        type: 'success',
        message: 'Preferences updated successfully!'
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Failed to update preferences. Please try again.'
      });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSnackbar = () => {
    setStatus({ type: '', message: '' });
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Grid container spacing={4}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Notification Settings
          </Typography>
          <FormControl component="fieldset" variant="standard">
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch 
                    checked={preferences.notifications.email} 
                    onChange={handleNotificationChange} 
                    name="email" 
                  />
                }
                label="Email Notifications"
              />
              <FormControlLabel
                control={
                  <Switch 
                    checked={preferences.notifications.inApp} 
                    onChange={handleNotificationChange} 
                    name="inApp" 
                  />
                }
                label="In-App Notifications"
              />
              <FormControlLabel
                control={
                  <Switch 
                    checked={preferences.notifications.sms} 
                    onChange={handleNotificationChange} 
                    name="sms" 
                  />
                }
                label="SMS Notifications"
              />
            </FormGroup>
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <Divider />
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Dashboard Settings
          </Typography>
          <FormControl component="fieldset" variant="standard">
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch 
                    checked={preferences.dashboard.showWeather} 
                    onChange={handleDashboardChange} 
                    name="showWeather" 
                  />
                }
                label="Show Weather Forecast"
              />
              <FormControlLabel
                control={
                  <Switch 
                    checked={preferences.dashboard.showUpcomingProjects} 
                    onChange={handleDashboardChange} 
                    name="showUpcomingProjects" 
                  />
                }
                label="Show Upcoming Projects"
              />
              <FormControlLabel
                control={
                  <Switch 
                    checked={preferences.dashboard.showInventoryAlerts} 
                    onChange={handleDashboardChange} 
                    name="showInventoryAlerts" 
                  />
                }
                label="Show Inventory Alerts"
              />
            </FormGroup>
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <Divider />
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Theme Settings
          </Typography>
          <FormControl component="fieldset">
            <RadioGroup
              name="theme"
              value={preferences.theme}
              onChange={handleThemeChange}
            >
              <FormControlLabel value="light" control={<Radio />} label="Light Theme" />
              <FormControlLabel value="dark" control={<Radio />} label="Dark Theme" />
              <FormControlLabel value="system" control={<Radio />} label="System Default" />
            </RadioGroup>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} display="flex" justifyContent="flex-end">
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isSubmitting}
          >
            Save Preferences
          </Button>
        </Grid>
      </Grid>
      
      <Snackbar
        open={!!status.message}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={status.type} 
          sx={{ width: '100%' }}
        >
          {status.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PreferencesSettings;

// services/userSettingsService.js
import axios from 'axios';

const API_URL = '/api/user/settings';

export const getUserSettings = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const updateProfile = async (profileData) => {
  const response = await axios.put(`${API_URL}/profile`, profileData);
  return response.data;
};

export const uploadProfileImage = async (formData) => {
  const response = await axios.post(`${API_URL}/profile-image`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const changePassword = async (passwordData) => {
  const response = await axios.put(`${API_URL}/password`, passwordData);
  return response.data;
};

export const updatePreferences = async (preferences) => {
  const response = await axios.put(`${API_URL}/preferences`, preferences);
  return response.data;
};