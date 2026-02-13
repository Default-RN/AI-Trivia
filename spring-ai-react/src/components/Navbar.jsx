import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
const { user, logout } = useAuth();
const navigate = useNavigate();

const handleLogout = () => {
    logout();
    navigate('/login');
};

return (
    <nav className="navbar">
    <div className="nav-brand">AI Travel & Recipe Hub</div>
    <div className="nav-links">
        <Link to="/dashboard">🏠 Dashboard</Link>
        <Link to="/travel">🌍 Travel Planner</Link>
        <Link to="/chat">💬 Chat AI</Link>
        <Link to="/recipe">🍳 Recipe Generator</Link>
    </div>
    <div className="nav-user">
        <span>👤 {user?.username}</span>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
    </div>
    </nav>
    );
};

export default Navbar;