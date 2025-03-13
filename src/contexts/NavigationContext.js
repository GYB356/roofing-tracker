import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Create context
const NavigationContext = createContext();

// Navigation provider component
export const NavigationProvider = ({ children }) => {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('');
  const [activeSubsection, setActiveSubsection] = useState('');
  
  // Update active section and subsection based on current path
  useEffect(() => {
    const path = location.pathname;
    
    // Extract main section from path
    const mainPath = path.split('/')[1] || 'dashboard';
    setActiveSection(mainPath);
    
    // Extract subsection if present
    const subPath = path.split('/')[2];
    setActiveSubsection(subPath || '');
    
  }, [location.pathname]);
  
  // Navigation map for breadcrumbs and page titles
  const navigationMap = {
    '': { title: 'Dashboard' },
    'dashboard': { title: 'Dashboard' },
    'appointments': { 
      title: 'Appointments',
      subsections: {
        '': { title: 'All Appointments' },
        'schedule': { title: 'Schedule New Appointment' },
        'calendar': { title: 'Appointments Calendar' }
      }
    },
    'medical-records': {
      title: 'Medical Records',
      subsections: {
        '': { title: 'Medical Records Overview' },
        'health-summary': { title: 'Health Summary' },
        'medications': { title: 'Medications' },
        'lab-results': { title: 'Lab Results' },
        'imaging': { title: 'Medical Imaging' }
      }
    },
    'messages': { title: 'Messages' },
    'telemedicine': { title: 'Telemedicine' },
    'health-metrics': { title: 'Health Metrics' },
    'clients': { title: 'Clients' },
    'projects': { title: 'Projects' },
    'tasks': { title: 'Tasks' },
    'time-tracking': {
      title: 'Time Tracking',
      subsections: {
        '': { title: 'Timer' },
        'entries': { title: 'Time Entries' },
        'summary': { title: 'Time Reports' },
        'settings': { title: 'Time Tracking Settings' },
        'log': { title: 'Log Time' }
      }
    },
    'billing': {
      title: 'Billing',
      subsections: {
        '': { title: 'Billing Dashboard' },
        'invoices': { title: 'Invoices' },
        'invoice-generator': { title: 'Generate Invoice' },
        'payment-methods': { title: 'Payment Methods' }
      }
    },
    'reports': { title: 'Reports' },
    'settings': { title: 'Settings' }
  };
  
  // Generate page title based on current route
  const getPageTitle = () => {
    const section = navigationMap[activeSection] || { title: 'Page Not Found' };
    
    if (activeSubsection && section.subsections && section.subsections[activeSubsection]) {
      return section.subsections[activeSubsection].title;
    }
    
    return section.title;
  };
  
  // Generate breadcrumbs based on current route
  const getBreadcrumbs = () => {
    const breadcrumbs = [];
    
    // Add home
    breadcrumbs.push({ title: 'Home', path: '/' });
    
    // Add current section
    if (activeSection && activeSection !== 'dashboard') {
      const section = navigationMap[activeSection];
      if (section) {
        breadcrumbs.push({ 
          title: section.title, 
          path: `/${activeSection}` 
        });
      }
    }
    
    // Add subsection if present
    if (activeSection && activeSubsection && navigationMap[activeSection]?.subsections) {
      const subsection = navigationMap[activeSection].subsections[activeSubsection];
      if (subsection) {
        breadcrumbs.push({ 
          title: subsection.title, 
          path: `/${activeSection}/${activeSubsection}`,
          active: true
        });
      }
    }
    
    return breadcrumbs;
  };
  
  // Public context value
  const contextValue = {
    activeSection,
    activeSubsection,
    pageTitle: getPageTitle(),
    breadcrumbs: getBreadcrumbs(),
    navigationMap
  };
  
  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
};

// Custom hook to use navigation context
export const useNavigation = () => {
  const context = useContext(NavigationContext);
  
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  
  return context;
}; 