// services/weatherService.js
import axios from 'axios';

// Using OpenWeatherMap API - you'll need to sign up for an API key at https://openweathermap.org/
const API_KEY = process.env.REACT_APP_WEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

/**
 * Get current weather for a location
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise} Weather data
 */
export const getCurrentWeather = async (lat, lon) => {
  try {
    const response = await axios.get(`${BASE_URL}/weather`, {
      params: {
        lat,
        lon,
        appid: API_KEY,
        units: 'imperial' // Use 'metric' for Celsius
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching current weather:', error);
    throw error;
  }
};

/**
 * Get weather forecast for a location
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} days - Number of days (max 7)
 * @returns {Promise} Forecast data
 */
export const getForecast = async (lat, lon, days = 5) => {
  try {
    const response = await axios.get(`${BASE_URL}/forecast`, {
      params: {
        lat,
        lon,
        appid: API_KEY,
        units: 'imperial', // Use 'metric' for Celsius
        cnt: days * 8 // 8 3-hour forecasts per day
      }
    });
    
    // Process and organize data by day
    const forecasts = response.data.list;
    const dailyForecasts = {};
    
    forecasts.forEach(forecast => {
      const date = new Date(forecast.dt * 1000);
      const day = date.toISOString().split('T')[0];
      
      if (!dailyForecasts[day]) {
        dailyForecasts[day] = {
          date: day,
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          temperatures: [],
          conditions: [],
          rain: [],
          wind: []
        };
      }
      
      dailyForecasts[day].temperatures.push(forecast.main.temp);
      dailyForecasts[day].conditions.push(forecast.weather[0].main);
      dailyForecasts[day].rain.push(forecast.rain ? forecast.rain['3h'] || 0 : 0);
      dailyForecasts[day].wind.push(forecast.wind.speed);
    });
    
    // Calculate daily summary
    return Object.values(dailyForecasts).map(day => ({
      ...day,
      highTemp: Math.round(Math.max(...day.temperatures)),
      lowTemp: Math.round(Math.min(...day.temperatures)),
      avgTemp: Math.round(day.temperatures.reduce((sum, temp) => sum + temp, 0) / day.temperatures.length),
      mainCondition: getMostFrequent(day.conditions),
      rainfall: day.rain.reduce((sum, amount) => sum + amount, 0).toFixed(2),
      maxWind: Math.round(Math.max(...day.wind)),
      icon: getWeatherIcon(getMostFrequent(day.conditions)),
      suitableForRoofing: isSuitableForRoofing(day)
    }));
  } catch (error) {
    console.error('Error fetching forecast:', error);
    throw error;
  }
};

/**
 * Get geocoding data for an address
 * @param {string} address - Full or partial address
 * @returns {Promise} Location data with coordinates
 */
export const getGeocode = async (address) => {
  try {
    const encodedAddress = encodeURIComponent(address);
    const response = await axios.get(`http://api.openweathermap.org/geo/1.0/direct`, {
      params: {
        q: encodedAddress,
        limit: 1,
        appid: API_KEY
      }
    });
    
    if (response.data && response.data.length > 0) {
      return {
        lat: response.data[0].lat,
        lon: response.data[0].lon,
        name: response.data[0].name,
        state: response.data[0].state,
        country: response.data[0].country
      };
    }
    throw new Error('Location not found');
  } catch (error) {
    console.error('Error geocoding address:', error);
    throw error;
  }
};

/**
 * Determine if weather conditions are suitable for roofing work
 * @param {Object} forecast - Daily forecast data
 * @returns {boolean} True if conditions are suitable
 */
const isSuitableForRoofing = (forecast) => {
  // Criteria for suitable roofing conditions:
  // - No rain/snow
  // - Wind speed below 20 mph
  // - Temperature between the roof manufacturer's recommended range (usually 45-85°F)
  
  const hasRain = forecast.rain.some(amount => amount > 0);
  const highWind = forecast.wind.some(speed => speed > 20);
  const tempTooLow = forecast.temperatures.some(temp => temp < 45);
  const tempTooHigh = forecast.temperatures.some(temp => temp > 85);
  
  return !hasRain && !highWind && !tempTooLow && !tempTooHigh;
};

/**
 * Get the most frequent value in an array
 * @param {Array} arr - Array of values
 * @returns {*} Most frequent value
 */
const getMostFrequent = (arr) => {
  const frequency = {};
  let maxFreq = 0;
  let mostFrequent;
  
  for (const item of arr) {
    frequency[item] = (frequency[item] || 0) + 1;
    
    if (frequency[item] > maxFreq) {
      maxFreq = frequency[item];
      mostFrequent = item;
    }
  }
  
  return mostFrequent;
};

/**
 * Map weather condition to icon name
 * @param {string} condition - Weather condition
 * @returns {string} Icon name
 */
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