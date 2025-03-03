import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    const currentYear = new Date().getFullYear();
    
    return (
        <footer className="footer bg-blue-500 p-4 text-white text-center">
            <p>&copy; {currentYear} HealthcareSync. All rights reserved.</p>
        </footer>
    );
};

export default Footer; 