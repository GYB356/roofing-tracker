import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
    const { user, logHipaaEvent } = useAuth();
    const [stats, setStats] = useState({
        appointments: 0,
        invoices: 0,
        messages: 0
    });
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                
                // In a real app, these would be API calls
                // const statsResponse = await fetch('/api/dashboard/stats');
                // const statsData = await statsResponse.json();
                
                // const activityResponse = await fetch('/api/dashboard/activity');
                // const activityData = await activityResponse.json();
                
                // Mock data for demonstration
                const mockStats = {
                    appointments: 3,
                    invoices: 2,
                    messages: 5
                };
                
                const mockActivity = [
                    {
                        id: 1,
                        type: 'appointment',
                        title: 'Appointment Scheduled',
                        description: 'Annual check-up with Dr. Smith',
                        date: '2023-06-15T10:30:00Z'
                    },
                    {
                        id: 2,
                        type: 'message',
                        title: 'New Message',
                        description: 'Dr. Johnson sent you lab results',
                        date: '2023-06-14T14:45:00Z'
                    },
                    {
                        id: 3,
                        type: 'invoice',
                        title: 'Invoice Paid',
                        description: 'Payment of $150.00 for consultation',
                        date: '2023-06-12T09:15:00Z'
                    },
                    {
                        id: 4,
                        type: 'prescription',
                        title: 'Prescription Renewed',
                        description: 'Your medication has been renewed',
                        date: '2023-06-10T16:20:00Z'
                    },
                    {
                        id: 5,
                        type: 'document',
                        title: 'Document Uploaded',
                        description: 'Insurance information updated',
                        date: '2023-06-08T11:05:00Z'
                    }
                ];
                
                // Log HIPAA event for dashboard access
                logHipaaEvent({
                    action: 'DASHBOARD_ACCESS',
                    description: 'User accessed dashboard',
                    timestamp: new Date().toISOString()
                });
                
                // Simulate API delay
                setTimeout(() => {
                    setStats(mockStats);
                    setRecentActivity(mockActivity);
                    setLoading(false);
                }, 1000);
                
            } catch (err) {
                setError('Failed to load dashboard data');
                setLoading(false);
                console.error('Error fetching dashboard data:', err);
            }
        };

        if (user) {
            fetchDashboardData();
        }
    }, [user, logHipaaEvent]);

    // Format date to readable format
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // Format time to readable format
    const formatTime = (dateString) => {
        const options = { hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleTimeString(undefined, options);
    };

    // Get icon based on activity type
    const getActivityIcon = (type) => {
        switch (type) {
            case 'appointment':
                return (
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-100 text-blue-600">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                );
            case 'message':
                return (
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-100 text-green-600">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                    </div>
                );
            case 'invoice':
                return (
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-yellow-100 text-yellow-600">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                );
            case 'document':
                return (
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-purple-100 text-purple-600">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                );
            default:
                return (
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-gray-100 text-gray-600">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                );
        }
    };
    
    // Get quick actions based on user role
    const getQuickActions = () => {
        const commonActions = [
            {
                title: 'View Appointments',
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                ),
                link: '/appointments'
            },
            {
                title: 'Messages',
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                ),
                link: '/messages'
            }
        ];
        
        if (!user || !user.role) return commonActions;
        
        switch (user.role) {
            case 'patient':
                return [
                    ...commonActions,
                    {
                        title: 'Schedule Appointment',
                        icon: (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        ),
                        link: '/appointments/new'
                    },
                    {
                        title: 'View Medical Records',
                        icon: (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        ),
                        link: '/medical-records'
                    }
                ];
            case 'doctor':
                return [
                    ...commonActions,
                    {
                        title: 'Patient List',
                        icon: (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        ),
                        link: '/patients'
                    },
                    {
                        title: 'Create Medical Record',
                        icon: (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        ),
                        link: '/medical-records/new'
                    }
                ];
            case 'nurse':
                return [
                    ...commonActions,
                    {
                        title: 'Patient List',
                        icon: (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        ),
                        link: '/patients'
                    },
                    {
                        title: 'Update Vitals',
                        icon: (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        ),
                        link: '/vitals'
                    }
                ];
            case 'admin':
                return [
                    ...commonActions,
                    {
                        title: 'User Management',
                        icon: (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        ),
                        link: '/admin/users'
                    },
                    {
                        title: 'System Settings',
                        icon: (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        ),
                        link: '/admin/settings'
                    }
                ];
            case 'staff':
                return [
                    ...commonActions,
                    {
                        title: 'Manage Appointments',
                        icon: (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        ),
                        link: '/appointments/manage'
                    },
                    {
                        title: 'Billing',
                        icon: (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        ),
                        link: '/billing'
                    }
                ];
            default:
                return commonActions;
        }
    };
    
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">
                    Welcome, {user ? `${user.firstName} ${user.lastName}` : 'User'}
                </h1>
                <p className="text-gray-600 mt-1">
                    {user && user.role && `Role: ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}`}
                </p>
            </div>
            
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
                    <span className="block sm:inline">{error}</span>
                </div>
            )}
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <h2 className="font-semibold text-gray-600">Appointments</h2>
                            <p className="text-2xl font-bold text-gray-900">
                                {loading ? (
                                    <span className="inline-block w-12 h-6 bg-gray-200 animate-pulse rounded"></span>
                                ) : (
                                    stats.appointments
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="mt-4">
                        <Link to="/appointments" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            View all appointments →
                        </Link>
                    </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <h2 className="font-semibold text-gray-600">Invoices</h2>
                            <p className="text-2xl font-bold text-gray-900">
                                {loading ? (
                                    <span className="inline-block w-12 h-6 bg-gray-200 animate-pulse rounded"></span>
                                ) : (
                                    stats.invoices
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="mt-4">
                        <Link to="/billing" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            View all invoices →
                        </Link>
                    </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-green-100 text-green-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <h2 className="font-semibold text-gray-600">Messages</h2>
                            <p className="text-2xl font-bold text-gray-900">
                                {loading ? (
                                    <span className="inline-block w-12 h-6 bg-gray-200 animate-pulse rounded"></span>
                                ) : (
                                    stats.messages
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="mt-4">
                        <Link to="/messages" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            View all messages →
                        </Link>
                    </div>
                </div>
            </div>
            
            {/* Quick Actions */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {getQuickActions().map((action, index) => (
                        <Link
                            key={index}
                            to={action.link}
                            className="bg-white rounded-lg shadow p-4 flex flex-col items-center justify-center hover:bg-blue-50 transition-colors"
                        >
                            <div className="text-blue-600 mb-2">
                                {action.icon}
                            </div>
                            <span className="text-sm font-medium text-gray-900">{action.title}</span>
                        </Link>
                    ))}
                </div>
            </div>
            
            {/* Recent Activity */}
            <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {loading ? (
                        <div className="p-4">
                            <div className="animate-pulse space-y-4">
                                {[1, 2, 3].map((item) => (
                                    <div key={item} className="flex items-center">
                                        <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                                        <div className="ml-4 flex-1">
                                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                            <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : recentActivity.length > 0 ? (
                        <ul className="divide-y divide-gray-200">
                            {recentActivity.map((activity) => (
                                <li key={activity.id} className="p-4 hover:bg-gray-50">
                                    <div className="flex items-center">
                                        {getActivityIcon(activity.type)}
                                        <div className="ml-4">
                                            <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                                            <p className="text-sm text-gray-500">{activity.description}</p>
                                            <p className="text-xs text-gray-400 mt-1">{formatDate(activity.date)}</p>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-6 text-center">
                            <p className="text-gray-500">No recent activity found.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard; 