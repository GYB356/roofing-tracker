import React from 'react';
import { Link } from 'react-router-dom';
import { useNavigation } from '../../contexts/NavigationContext';
import { ChevronRight } from 'lucide-react';

const Breadcrumbs = () => {
  const { breadcrumbs } = useNavigation();
  
  if (!breadcrumbs || breadcrumbs.length <= 1) {
    return null; // Don't show breadcrumbs on home page
  }
  
  return (
    <nav className="flex mb-4" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          
          return (
            <li key={index} className="inline-flex items-center">
              {index > 0 && (
                <ChevronRight className="w-4 h-4 text-gray-400 mx-1" />
              )}
              
              {isLast ? (
                <span className="text-gray-500" aria-current="page">
                  {crumb.title}
                </span>
              ) : (
                <Link
                  to={crumb.path}
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {crumb.title}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs; 