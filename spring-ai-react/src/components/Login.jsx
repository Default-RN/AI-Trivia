import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
const [formData, setFormData] = useState({
    usernameOrEmail: '',
    password: ''
});
const [error, setError] = useState('');
const [loading, setLoading] = useState(false);

const { login } = useAuth();
const navigate = useNavigate();

const handleChange = (e) => {
    setFormData({
    ...formData,
    [e.target.name]: e.target.value
    });
};

const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(formData.usernameOrEmail, formData.password);
    
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
        <h2>Welcome Back! 👋</h2>
        <p>Login to your account</p>
        </div>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
            <label>Username or Email</label>
            <input
            type="text"
            name="usernameOrEmail"
            value={formData.usernameOrEmail}
            onChange={handleChange}
            placeholder="Enter username or email"
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
            placeholder="Enter password"
            required
            />
        </div>
        
        <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
        </button>
        </form>
        
        <div className="auth-footer">
        Don't have an account? <Link to="/register">Register here</Link>
        </div>
    </div>
    </div>
);
};

export default Login;