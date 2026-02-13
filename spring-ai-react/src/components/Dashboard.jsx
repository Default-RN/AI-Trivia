import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';

const Dashboard = () => {
const { user, logout } = useAuth();
const navigate = useNavigate();

const handleLogout = () => {
    logout();
    navigate('/login');
};

return (
    <div>
    <Navbar />
    <div className="container">
        <div className="welcome-card">
        <h1>Welcome, {user?.username || 'User'}! 🎉</h1>
        <p>Email: {user?.email}</p>
        <button onClick={handleLogout} className="logout-btn">
            Logout
        </button>
        </div>
        {/* Your Travel Planner, Chat, Recipe components will go here */}
    </div>
    </div>
);
};

export default Dashboard;