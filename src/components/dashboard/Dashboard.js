import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card.js';
import '../ui/card.css';

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <Card>
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Welcome to the Admin Dashboard</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;