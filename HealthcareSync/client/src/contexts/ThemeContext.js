import React, { createContext, useState, useEffect, useContext } from 'react';

// Create context
const ThemeContext = createContext();

// Custom hook to use the theme context
export const useTheme = () => {
  return useContext(ThemeContext);
};

// Theme provider component
export const ThemeProvider = ({ children }) => {
  // Check if user has a theme preference in localStorage
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
      return savedTheme;
    }
    
    // Check if user prefers dark mode at system level
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  };
  
  const [theme, setTheme] = useState(getInitialTheme);
  const [fontSize, setFontSize] = useState(localStorage.getItem('fontSize') || 'medium');
  const [highContrast, setHighContrast] = useState(localStorage.getItem('highContrast') === 'true');
  
  // Update theme in localStorage and document when it changes
  useEffect(() => {
    localStorage.setItem('theme', theme);
    
    // Update document class for theme
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);
  
  // Update font size in localStorage when it changes
  useEffect(() => {
    localStorage.setItem('fontSize', fontSize);
    
    // Update document class for font size
    document.documentElement.classList.remove('text-sm', 'text-base', 'text-lg', 'text-xl');
    
    switch (fontSize) {
      case 'small':
        document.documentElement.classList.add('text-sm');
        break;
      case 'medium':
        document.documentElement.classList.add('text-base');
        break;
      case 'large':
        document.documentElement.classList.add('text-lg');
        break;
      case 'extra-large':
        document.documentElement.classList.add('text-xl');
        break;
      default:
        document.documentElement.classList.add('text-base');
    }
  }, [fontSize]);
  
  // Update high contrast in localStorage when it changes
  useEffect(() => {
    localStorage.setItem('highContrast', highContrast);
    
    // Update document class for high contrast
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [highContrast]);
  
  // Toggle theme between light and dark
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };
  
  // Toggle high contrast mode
  const toggleHighContrast = () => {
    setHighContrast(prev => !prev);
  };
  
  // Change font size
  const changeFontSize = (size) => {
    if (['small', 'medium', 'large', 'extra-large'].includes(size)) {
      setFontSize(size);
    }
  };
  
  // Increase font size
  const increaseFontSize = () => {
    switch (fontSize) {
      case 'small':
        setFontSize('medium');
        break;
      case 'medium':
        setFontSize('large');
        break;
      case 'large':
        setFontSize('extra-large');
        break;
      default:
        break;
    }
  };
  
  // Decrease font size
  const decreaseFontSize = () => {
    switch (fontSize) {
      case 'extra-large':
        setFontSize('large');
        break;
      case 'large':
        setFontSize('medium');
        break;
      case 'medium':
        setFontSize('small');
        break;
      default:
        break;
    }
  };
  
  // Reset all accessibility settings to defaults
  const resetAccessibilitySettings = () => {
    setTheme('light');
    setFontSize('medium');
    setHighContrast(false);
  };
  
  // Value object to be provided by context
  const value = {
    theme,
    fontSize,
    highContrast,
    toggleTheme,
    changeFontSize,
    increaseFontSize,
    decreaseFontSize,
    toggleHighContrast,
    resetAccessibilitySettings,
    isDarkMode: theme === 'dark'
  };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}; 