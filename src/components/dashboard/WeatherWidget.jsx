// components/dashboard/WeatherWidget.jsx
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Divider, 
  Icon, 
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  WbSunny, 
  Cloud, 
  Umbrella, 
  AcUnit, 
  Grain,
  FlashOn,
  Air,
  HelpOutline
} from '@mui/icons-material';
import { getCurrentWeather, getForecast } from '../../services/weatherService';

const iconComponents = {
  'wb_sunny': WbSunny,
  'cloud': Cloud,
  'umbrella': Umbrella,
  'ac_unit': AcUnit,
  'grain': Grain,
  'flash_on': FlashOn,
  'air': Air,
  'help_outline': HelpOutline
};

const WeatherWidget = ({ latitude, longitude, location, projectDates, showForecast = true }) => {
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Extract coordinates from props
  const lat = location?.lat || latitude;
  const lon = location?.lon || longitude;
  const locationName = location?.name || null;

  useEffect(() => {
    const fetchWeatherData = async () => {
      if (!lat || !lon) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const [currentData, forecastData] = await Promise.all([
          getCurrentWeather(lat, lon),
          showForecast ? getForecast(lat, lon, 5) : Promise.resolve([])
        ]);
        
        setCurrentWeather(currentData);
        setForecast(forecastData);
      } catch (err) {
        console.error('Failed to fetch weather data:', err);
        setError('Failed to load weather information. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherData();
  }, [lat, lon, showForecast]);

  if (loading) {
    return (
      <Card elevation={3}>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" p={2}>
            <CircularProgress size={40} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card elevation={3}>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  if (!currentWeather) {
    return (
      <Card elevation={3}>
        <CardContent>
          <Alert severity="info">No weather data available for this location.</Alert>
        </CardContent>
      </Card>
    );
  }

  // Get project dates (if provided) to highlight on the forecast
  const projectDateSet = new Set();
  if (projectDates && Array.isArray(projectDates)) {
    projectDates.forEach(date => {
      if (date instanceof Date) {
        projectDateSet.add(date.toISOString().split('T')[0]);
      } else if (typeof date === 'string') {
        projectDateSet.add(date.split('T')[0]);
      }
    });
  }

  return (
    <Card elevation={3}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Weather Forecast: {locationName || location || currentWeather.name}
        </Typography>
        
        {/* Current Weather */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 2, 
            p: 1, 
            bgcolor: 'background.paper' 
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
            {React.createElement(
              iconComponents[getWeatherIcon(currentWeather.weather[0].main)] || HelpOutline,
              { fontSize: 'large', sx: { fontSize: 48, mr: 2 } }
            )}
            <Box>
              <Typography variant="h4">
                {Math.round(currentWeather.main.temp)}°F
              </Typography>
              <Typography variant="body2">
                Feels like {Math.round(currentWeather.main.feels_like)}°F
              </Typography>
            </Box>
          </Box>
          
          <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
          
          <Box>
            <Typography variant="body1">
              {currentWeather.weather[0].description.charAt(0).toUpperCase() + 
               currentWeather.weather[0].description.slice(1)}
            </Typography>
            <Typography variant="body2">
              Humidity: {currentWeather.main.humidity}% | 
              Wind: {Math.round(currentWeather.wind.speed)} mph
            </Typography>
          </Box>
        </Box>
        
        {/* 5-Day Forecast - only show if showForecast is true */}
        {showForecast && forecast.length > 0 && (
          <>
            <Typography variant="subtitle1" gutterBottom>
              5-Day Forecast
            </Typography>
            
            <Grid container spacing={1}>
              {forecast.map((day, index) => {
                const isProjectDate = projectDateSet.has(day.date);
                const IconComponent = iconComponents[day.icon] || HelpOutline;
                
                return (
                  <Grid item xs={12} sm={6} md={2.4} key={index}>
                    <Card 
                      elevation={1} 
                      sx={{ 
                        position: 'relative',
                        bgcolor: isProjectDate ? 'action.selected' : 'background.paper',
                        border: isProjectDate ? '1px solid' : 'none',
                        borderColor: 'primary.main'
                      }}
                    >
                      {isProjectDate && (
                        <Chip
                          label="Project Day"
                          color="primary"
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: -10,
                            right: 8,
                            zIndex: 1
                          }}
                        />
                      )}
                      
                      <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                        <Box textAlign="center">
                          <Typography variant="subtitle2">{day.day}</Typography>
                          <IconComponent color={day.suitableForRoofing ? "primary" : "error"} />
                          <Typography variant="body2">
                            {day.highTemp}° / {day.lowTemp}°
                          </Typography>
                          <Typography variant="caption" display="block">
                            {day.mainCondition}
                          </Typography>
                          
                          <Chip 
                            label={day.suitableForRoofing ? "Suitable" : "Not Suitable"} 
                            color={day.suitableForRoofing ? "success" : "error"}
                            size="small"
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </>
        )}
        
        <Box mt={1}>
          <Typography variant="caption" color="text.secondary">
            Last updated: {new Date().toLocaleTimeString()}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

// Helper function to get weather icon
const getWeatherIcon = (condition) => {
  const iconMap = {
    'Clear': 'wb_sunny',
    'Clouds': 'cloud',
    'Rain': 'umbrella',
    'Drizzle': 'grain',
    'Thunderstorm': 'flash_on',
    'Snow': 'ac_unit',
    'Mist': 'cloud',
    'Smoke': 'cloud',
    'Haze': 'cloud',
    'Dust': 'cloud',
    'Fog': 'cloud',
    'Sand': 'cloud',
    'Ash': 'cloud',
    'Squall': 'air',
    'Tornado': 'tornado'
  };
  
  return iconMap[condition] || 'help_outline';
};

export default WeatherWidget;

// components/dashboard/ProjectWeatherCard.jsx
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Divider, 
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import { getGeocode, getForecast } from '../../services/weatherService';

const ProjectWeatherCard = ({ project }) => {
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchWeatherData = async () => {
      if (!project || !project.address) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Get coordinates from address
        const geoData = await getGeocode(
          `${project.address.street}, ${project.address.city}, ${project.address.state}`
        );
        
        // Get forecast for the next 7 days
        const forecastData = await getForecast(geoData.lat, geoData.lon, 7);
        
        setForecast(forecastData);
      } catch (err) {
        console.error('Failed to fetch weather forecast:', err);
        setError('Unable to load weather data for this project location.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchWeatherData();
  }, [project]);
  
  // Create date set for project's scheduled dates
  const scheduledDates = new Set();
  if (project && project.schedule) {
    project.schedule.forEach(date => {
      if (date instanceof Date) {
        scheduledDates.add(date.toISOString().split('T')[0]);
      } else if (typeof date === 'string') {
        scheduledDates.add(date.split('T')[0]);
      }
    });
  }
  
  // Filter forecast to only show scheduled days
  const scheduledForecast = forecast.filter(day => scheduledDates.has(day.date));
  
  if (loading) {
    return (
      <Card elevation={2} sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" justifyContent="center" p={1}>
            <CircularProgress size={30} />
          </Box>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card elevation={2} sx={{ mb: 2 }}>
        <CardContent>
          <Alert severity="warning" variant="outlined">{error}</Alert>
        </CardContent>
      </Card>
    );
  }
  
  // Skip rendering if no scheduled dates match the forecast
  if (scheduledForecast.length === 0) {
    return null;
  }
  
  // Check if any scheduled days are unsuitable for roofing
  const hasUnsuitable = scheduledForecast.some(day => !day.suitableForRoofing);
  
  return (
    <Card 
      elevation={2} 
      sx={{ 
        mb: 2,
        border: hasUnsuitable ? '1px solid' : 'none',
        borderColor: 'error.main'
      }}
    >
      <CardContent>
        <Typography variant="subtitle1" gutterBottom>
          Weather Forecast for Scheduled Days
        </Typography>
        
        {hasUnsuitable && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Weather conditions may be unsuitable for roofing on some scheduled days.
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', overflowX: 'auto', pb: 1 }}>
          {scheduledForecast.map((day, index) => (
            <Box 
              key={index} 
              sx={{ 
                minWidth: 120, 
                p: 1,
                mr: 1,
                textAlign: 'center',
                border: '1px solid',
                borderColor: day.suitableForRoofing ? 'success.light' : 'error.light',
                borderRadius: 1
              }}
            >
              <Typography variant="body2" fontWeight="bold">
                {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </Typography>
              
              <Typography variant="h6">{day.highTemp}°F</Typography>
              
              <Typography variant="caption" display="block">
                {day.mainCondition} 
                {day.rainfall > 0 ? ` · ${day.rainfall}" rain` : ''}
              </Typography>
              
              <Chip 
                label={day.suitableForRoofing ? "Suitable" : "Not Suitable"}
                color={day.suitableForRoofing ? "success" : "error"}
                size="small"
                sx={{ mt: 0.5 }}
              />
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProjectWeatherCard;

// components/dashboard/EnhancedDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Grid, Box, Typography, Paper } from '@mui/material';
import WeatherWidget from './WeatherWidget';
import UpcomingProjects from './UpcomingProjects';
import InventorySummary from './InventorySummary';
import RecentActivity from './RecentActivity';
import ProjectWeatherCard from './ProjectWeatherCard';
import { getUserSettings } from '../../services/userSettingsService';

const EnhancedDashboard = () => {
  const [settings, setSettings] = useState({
    preferences: {
      dashboard: {
        showWeather: true,
        showUpcomingProjects: true,
        showInventoryAlerts: true
      }
    }
  });
  const [userLocation, setUserLocation] = useState(null);
  
  useEffect(() => {
    // Get user settings
    const fetchSettings = async () => {
      try {
        const userSettings = await getUserSettings();
        setSettings(userSettings);
      } catch (error) {
        console.error('Failed to fetch user settings:', error);
      }
    };
    
    // Get user's current location for weather widget
    const getUserLocation = () => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
          },
          (error) => {
            console.error('Error getting location:', error);
          }
        );
      }
    };
    
    fetchSettings();
    getUserLocation();
  }, []);
  
  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Grid container spacing={3}>
        {/* Current Weather Widget */}
        {settings.preferences.dashboard.showWeather && userLocation && (
          <Grid item xs={12}>
            <WeatherWidget 
              latitude={userLocation.latitude} 
              longitude={userLocation.longitude} 
            />
          </Grid>
        )}
        
        {/* Upcoming Projects */}
        {settings.preferences.dashboard.showUpcomingProjects && (
          <Grid item xs={12} md={6}>
            <UpcomingProjects />
          </Grid>
        )}
        
        {/* Inventory Summary */}
        {settings.preferences.dashboard.showInventoryAlerts && (
          <Grid item xs={12} md={6}>
            <InventorySummary />
          </Grid>
        )}
        
        {/* Recent Activity */}
        <Grid item xs={12}>
          <RecentActivity />
        </Grid>
      </Grid>
    </Box>
  );
};

export default EnhancedDashboard;

// components/projects/ProjectDetails.jsx (Weather integration)
// Add this to your existing ProjectDetails component
import ProjectWeatherCard from '../dashboard/ProjectWeatherCard';

// Inside the ProjectDetails component, add this section:
/*
{project && (
  <ProjectWeatherCard project={project} />
)}
*/