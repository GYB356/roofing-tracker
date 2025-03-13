import React from 'react';
import { useNavigation } from '../../contexts/NavigationContext';
import Breadcrumbs from './Breadcrumbs';

const PageHeader = ({ 
  title, 
  description, 
  actions, 
  showBreadcrumbs = true,
  className = '' 
}) => {
  const { pageTitle } = useNavigation();
  
  return (
    <div className={`mb-6 ${className}`}>
      {/* Breadcrumbs navigation */}
      {showBreadcrumbs && <Breadcrumbs />}
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          {/* Page title */}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-100">
            {title || pageTitle}
          </h1>
          
          {/* Optional description */}
          {description && (
            <p className="mt-1 text-gray-400">{description}</p>
          )}
        </div>
        
        {/* Optional action buttons */}
        {actions && (
          <div className="flex flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader; 