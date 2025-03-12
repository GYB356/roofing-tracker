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
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <main className="p-6 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen">
          {/* This is where your page content goes */}
          {children}
        </main>
      </div>
    </div>
  );
};

export default PageLayout;