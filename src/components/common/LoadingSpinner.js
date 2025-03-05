import React from 'react';

/**
 * Loading spinner component that can be displayed full screen or inline
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.fullScreen - Whether to display full screen
 * @param {string} props.size - Size of the spinner (sm, md, lg)
 * @param {string} props.color - Color of the spinner
 * @returns {JSX.Element} The spinner component
 */
const LoadingSpinner = ({ fullScreen = false, size = 'md', color = 'blue' }) => {
  // Determine spinner size
  const sizeClass = {
    sm: 'h-5 w-5 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  };

  // Determine spinner color
  const colorClass = {
    blue: 'border-blue-500',
    gray: 'border-gray-500',
    green: 'border-green-500',
    red: 'border-red-500',
  };

  const spinner = (
    <div className={`animate-spin rounded-full ${sizeClass[size]} ${colorClass[color]} border-t-transparent`}></div>
  );

  // Return full screen or inline spinner
  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50">
        <div className="text-center">
          {spinner}
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <div className="flex justify-center py-4">{spinner}</div>;
};

export default LoadingSpinner;