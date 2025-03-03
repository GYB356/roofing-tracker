import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Unauthorized = () => {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
                <div className="mb-6">
                    <svg 
                        className="mx-auto h-16 w-16 text-red-500" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                        />
                    </svg>
                </div>
                
                <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h1>
                
                <p className="text-gray-600 mb-6">
                    You don't have permission to access this page. This access attempt has been logged.
                </p>
                
                {user && (
                    <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left">
                        <p className="text-sm text-gray-500 mb-1">Current user:</p>
                        <p className="font-medium">{user.firstName} {user.lastName}</p>
                        <p className="text-sm text-gray-500 capitalize">Role: {user.role}</p>
                    </div>
                )}
                
                <div className="flex flex-col space-y-3">
                    <Link 
                        to="/dashboard" 
                        className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                    >
                        Go to Dashboard
                    </Link>
                    
                    <Link 
                        to="/" 
                        className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                    >
                        Go to Home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Unauthorized; 