import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Register = () => {
const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
});
const [error, setError] = useState('');
const [loading, setLoading] = useState(false);

const { register } = useAuth();
const navigate = useNavigate();

const handleChange = (e) => {
    setFormData({
    ...formData,
    [e.target.name]: e.target.value
    });
};

const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
    return false;
    }
    if (formData.password.length < 6) {
    setError('Password must be at least 6 characters');
    return false;
    }
    return true;
};

const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;
    
    setLoading(true);

    const { confirmPassword, ...registerData } = formData;
    const result = await register(registerData);
    
    if (result.success) {
    navigate('/dashboard');
    } else {
    setError(result.message);
    }
    
    setLoading(false);
};

return (
    <div className="auth-container">
    <div className="auth-card">
        <div className="auth-header">
        <h2>Create Account ✨</h2>
        <p>Join our AI Travel & Recipe Hub</p>
        </div>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
            <label>Full Name</label>
            <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Enter your full name"
            required
            />
        </div>
        
        <div className="form-group">
            <label>Username</label>
            <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Choose a username"
            required
            />
        </div>
        
        <div className="form-group">
            <label>Email</label>
            <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            required
            />
        </div>
        
        <div className="form-group">
            <label>Password</label>
            <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Create password (min. 6 characters)"
            required
            />
        </div>
        
        <div className="form-group">
            <label>Confirm Password</label>
            <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm password"
            required
            />
        </div>
        
        <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
        </button>
        </form>
        
        <div className="auth-footer">
        Already have an account? <Link to="/login">Login here</Link>
        </div>
    </div>
    </div>
);
};

export default Register;