import React from 'react';
import Sidebar from './Sidebar';
import { NavigationProvider } from '../../contexts/NavigationContext';

const AppLayout = ({ children }) => {
  return (
    <NavigationProvider>
      <div className="flex min-h-screen bg-gray-900">
        <Sidebar />
        
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </NavigationProvider>
  );
};

export default AppLayout; 