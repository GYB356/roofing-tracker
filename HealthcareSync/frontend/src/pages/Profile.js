import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
    const { user, logHipaaEvent } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Fetch user profile data
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                // In a real app, this would be an API call
                // const response = await fetch(`/api/users/${user.id}/profile`);
                // const data = await response.json();
                
                // Mock data for demonstration
                const mockProfile = {
                    personalInfo: {
                        firstName: user?.firstName || 'John',
                        lastName: user?.lastName || 'Doe',
                        email: user?.email || 'john.doe@example.com',
                    phone: '(555) 123-4567',
                        dateOfBirth: '1985-05-15',
                        gender: 'Male'
                    },
                    address: {
                        street: '123 Main St',
                        city: 'Anytown',
                        state: 'CA',
                        zipCode: '12345',
                        country: 'USA'
                    },
                    emergencyContact: {
                        name: 'Jane Doe',
                        relationship: 'Spouse',
                        phone: '(555) 987-6543'
                    },
                    medicalInfo: {
                        bloodType: 'O+',
                        allergies: 'Penicillin',
                        medications: 'None',
                        conditions: 'Asthma'
                    },
                    preferences: {
                        notifications: true,
                        language: 'English',
                        theme: 'Light'
                    }
                };
                
                setTimeout(() => {
                    setProfile(mockProfile);
                    setLoading(false);
                }, 1000); // Simulate network delay
                
            } catch (err) {
                setError('Failed to load profile data');
                setLoading(false);
                console.error('Error fetching profile:', err);
            }
        };
        
        if (user) {
            fetchProfile();
        }
    }, [user]);
    
    const handleInputChange = (section, field, value) => {
        setProfile({
            ...profile,
            [section]: {
                ...profile[section],
                [field]: value
            }
        });
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            setLoading(true);
            
            // In a real app, this would be an API call
            // await fetch(`/api/users/${user.id}/profile`, {
            //     method: 'PUT',
            //     headers: {
            //         'Content-Type': 'application/json',
            //     },
            //     body: JSON.stringify(profile),
            // });
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            logHipaaEvent({
                action: 'PROFILE_UPDATE',
                description: 'User updated their profile information',
                timestamp: new Date().toISOString()
            });
            
            setSuccessMessage('Profile updated successfully');
            setIsEditing(false);
            
            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccessMessage('');
            }, 3000);
            
        } catch (err) {
            setError('Failed to update profile');
            console.error('Error updating profile:', err);
        } finally {
            setLoading(false);
        }
    };
    
    if (loading && !profile) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error && !profile) {
        return (
            <div className="text-center p-6">
                <div className="text-red-500 text-xl">{error}</div>
                <button 
                    onClick={() => window.location.reload()} 
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Retry
                </button>
            </div>
        );
    }
    
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        disabled={loading}
                            >
                                Edit Profile
                            </button>
                        ) : (
                    <div className="flex space-x-2">
                            <button
                                onClick={() => setIsEditing(false)}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                            disabled={loading}
                            >
                                Cancel
                            </button>
                        <button
                            onClick={handleSubmit}
                            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                        )}
                    </div>

            {successMessage && (
                <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                    {successMessage}
                </div>
            )}
                
                {error && (
                <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}
                
                <form onSubmit={handleSubmit}>
                {/* Personal Information */}
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Personal Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                    <input
                                        type="text"
                                value={profile.personalInfo.firstName}
                                onChange={(e) => handleInputChange('personalInfo', 'firstName', e.target.value)}
                                        disabled={!isEditing}
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                    <input
                                        type="text"
                                value={profile.personalInfo.lastName}
                                onChange={(e) => handleInputChange('personalInfo', 'lastName', e.target.value)}
                                        disabled={!isEditing}
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                value={profile.personalInfo.email}
                                onChange={(e) => handleInputChange('personalInfo', 'email', e.target.value)}
                                disabled={!isEditing}
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                    <input
                                        type="tel"
                                value={profile.personalInfo.phone}
                                onChange={(e) => handleInputChange('personalInfo', 'phone', e.target.value)}
                                        disabled={!isEditing}
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                                    <input
                                        type="date"
                                value={profile.personalInfo.dateOfBirth}
                                onChange={(e) => handleInputChange('personalInfo', 'dateOfBirth', e.target.value)}
                                        disabled={!isEditing}
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                                    <select
                                value={profile.personalInfo.gender}
                                onChange={(e) => handleInputChange('personalInfo', 'gender', e.target.value)}
                                        disabled={!isEditing}
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                                <option value="Prefer not to say">Prefer not to say</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                {/* Address */}
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Address</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                                    <input
                                        type="text"
                                value={profile.address.street}
                                onChange={(e) => handleInputChange('address', 'street', e.target.value)}
                                        disabled={!isEditing}
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                    <input
                                        type="text"
                                value={profile.address.city}
                                onChange={(e) => handleInputChange('address', 'city', e.target.value)}
                                        disabled={!isEditing}
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                                    <input
                                        type="text"
                                value={profile.address.state}
                                onChange={(e) => handleInputChange('address', 'state', e.target.value)}
                                        disabled={!isEditing}
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                                    <input
                                        type="text"
                                value={profile.address.zipCode}
                                onChange={(e) => handleInputChange('address', 'zipCode', e.target.value)}
                                        disabled={!isEditing}
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                                    <input
                                        type="text"
                                value={profile.address.country}
                                onChange={(e) => handleInputChange('address', 'country', e.target.value)}
                                        disabled={!isEditing}
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                        
                {/* Emergency Contact */}
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Emergency Contact</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                    <input
                                        type="text"
                                value={profile.emergencyContact.name}
                                onChange={(e) => handleInputChange('emergencyContact', 'name', e.target.value)}
                                        disabled={!isEditing}
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                                    <input
                                        type="text"
                                value={profile.emergencyContact.relationship}
                                onChange={(e) => handleInputChange('emergencyContact', 'relationship', e.target.value)}
                                        disabled={!isEditing}
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                    <input
                                        type="tel"
                                value={profile.emergencyContact.phone}
                                onChange={(e) => handleInputChange('emergencyContact', 'phone', e.target.value)}
                                        disabled={!isEditing}
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                        
                {/* Medical Information */}
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Medical Information</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Blood Type</label>
                                        <select
                                value={profile.medicalInfo.bloodType}
                                onChange={(e) => handleInputChange('medicalInfo', 'bloodType', e.target.value)}
                                            disabled={!isEditing}
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="A+">A+</option>
                                            <option value="A-">A-</option>
                                            <option value="B+">B+</option>
                                            <option value="B-">B-</option>
                                            <option value="AB+">AB+</option>
                                            <option value="AB-">AB-</option>
                                            <option value="O+">O+</option>
                                            <option value="O-">O-</option>
                                <option value="Unknown">Unknown</option>
                                        </select>
                                    </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
                            <input
                                type="text"
                                value={profile.medicalInfo.allergies}
                                onChange={(e) => handleInputChange('medicalInfo', 'allergies', e.target.value)}
                                disabled={!isEditing}
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Current Medications</label>
                            <textarea
                                value={profile.medicalInfo.medications}
                                onChange={(e) => handleInputChange('medicalInfo', 'medications', e.target.value)}
                                disabled={!isEditing}
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows="3"
                            ></textarea>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Medical Conditions</label>
                            <textarea
                                value={profile.medicalInfo.conditions}
                                onChange={(e) => handleInputChange('medicalInfo', 'conditions', e.target.value)}
                                disabled={!isEditing}
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows="3"
                            ></textarea>
                        </div>
                                </div>
                            </div>
                        
                {/* Preferences */}
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Preferences</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                            <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                    checked={profile.preferences.notifications}
                                    onChange={(e) => handleInputChange('preferences', 'notifications', e.target.checked)}
                                                disabled={!isEditing}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                <span className="ml-2 text-sm text-gray-700">Enable notifications</span>
                                            </label>
                                </div>
                                <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                                    <select
                                value={profile.preferences.language}
                                onChange={(e) => handleInputChange('preferences', 'language', e.target.value)}
                                        disabled={!isEditing}
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="English">English</option>
                                <option value="Spanish">Spanish</option>
                                <option value="French">French</option>
                                <option value="German">German</option>
                                <option value="Chinese">Chinese</option>
                                    </select>
                                </div>
                                <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
                                    <select
                                value={profile.preferences.theme}
                                onChange={(e) => handleInputChange('preferences', 'theme', e.target.value)}
                                        disabled={!isEditing}
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="Light">Light</option>
                                <option value="Dark">Dark</option>
                                <option value="System">System Default</option>
                                    </select>
                            </div>
                        </div>
                    </div>
                    
                    {isEditing && (
                    <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                            className="px-4 py-2 mr-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                            disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    )}
                </form>
        </div>
    );
};

export default Profile; 