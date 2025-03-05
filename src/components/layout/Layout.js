import React from 'react';

/**
 * Reusable page layout component for consistent design across all pages
 * 
 * @param {string} title - The page title
 * @param {string} description - Brief description of the page
 * @param {string} bgColor - Background color class for the header (default: "bg-blue-600")
 * @param {string} textColor - Text color class for the description (default: "text-blue-100")
 * @param {React.ReactNode} children - The page content
 * @param {React.ReactNode} actions - Optional action buttons to display in the header
 */
const PageLayout = ({ 
  title, 
  description, 
  bgColor = "bg-blue-600", 
  textColor = "text-blue-100", 
  children,
  actions
}) => {
  return (
    <div className="container mx-auto px-4 py-6 max-w-screen-xl">
      {/* Header section */}
      <div className={`${bgColor} rounded-t-lg shadow-lg overflow-hidden`}>
        <div className="px-6 py-8 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              <p className={`mt-2 ${textColor}`}>{description}</p>
            </div>
            {actions && (
              <div className="ml-4">
                {actions}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Content section */}
      <div className="bg-white dark:bg-gray-800 rounded-b-lg shadow-lg p-6">
        {children}
      </div>
    </div>
  );
};

export default PageLayout;