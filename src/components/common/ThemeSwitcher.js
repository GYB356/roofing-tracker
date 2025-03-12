import React, { useEffect, useState } from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

const ThemeSwitcher = () => {
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('theme') === 'dark'
  );

  useEffect(() => {
    // On initial load, set theme based on localStorage or system preference
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
      // If a theme was saved in localStorage, use that
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
      setDarkMode(savedTheme === 'dark');
    } else {
      // If no saved theme, default to light theme (as requested)
      document.documentElement.classList.remove('dark');
      setDarkMode(false);
      localStorage.setItem('theme', 'light');
    }
  }, []);

  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    // Update classList and localStorage
    document.documentElement.classList.toggle('dark', newDarkMode);
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300 focus:outline-none"
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {darkMode ? (
        <SunIcon className="h-5 w-5" />
      ) : (
        <MoonIcon className="h-5 w-5" />
      )}
    </button>
  );
};

export default ThemeSwitcher; 