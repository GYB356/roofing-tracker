import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';

const Layout = ({ children }) => {
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Update document body class when theme changes
  useEffect(() => {
    document.body.className = theme === 'dark' ? 'dark bg-gray-900' : 'bg-gray-50';
  }, [theme]);
  
  // Close sidebar when route changes (on mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);
  
  // Toggle sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  // Determine if the current route should have a sidebar
  const shouldShowSidebar = () => {
    // Don't show sidebar for auth pages
    const noSidebarRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];
    return isAuthenticated && !noSidebarRoutes.some(route => location.pathname.startsWith(route));
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main-content" className="skip-to-content">
        Skip to content
      </a>
      
      {/* Navbar */}
      <Navbar toggleSidebar={toggleSidebar} />
      
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      <div className="flex flex-1">
        {/* Sidebar */}
        {shouldShowSidebar() && (
          <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        )}
        
        {/* Main Content */}
        <main 
          id="main-content" 
          className={`flex-1 transition-all duration-300 ${shouldShowSidebar() ? 'lg:ml-64' : ''}`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Layout; 