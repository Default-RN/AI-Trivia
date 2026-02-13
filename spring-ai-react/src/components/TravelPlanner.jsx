import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TravelPlanner = () => {
const [formData, setFormData] = useState({
    destination: '',
    days: 5,
    interests: '',
    budget: 'moderate'
});
// Add this at the top of your component to check if token exists
useEffect(() => {
const token = localStorage.getItem('token');
console.log('JWT Token exists:', !!token);
if (token) {
    console.log('Token preview:', token.substring(0, 20) + '...');
}
}, []);
const [itinerary, setItinerary] = useState('');
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');

const handleChange = (e) => {
    setFormData({
    ...formData,
    [e.target.name]: e.target.value
    });
};

const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setItinerary('');

    if (!formData.destination.trim()) {
    setError('Destination is required');
    setLoading(false);
    return;
    }

    try {
    console.log('📤 Sending GET request to /travel/itinerary');
    
    const response = await axios.get('http://localhost:8080/travel/itinerary', {
        params: {
            destination: formData.destination.trim(),
            days: parseInt(formData.days),
            interests: formData.interests.trim() || 'general sightseeing',
            budget: formData.budget
        }
    });

    console.log('📥 Response received:', response.data);
    setItinerary(response.data);
    } catch (err) {
    console.error('❌ Error:', err);

    if (err.response) {
        setError(`Server error (${err.response.status}): ${err.response.data}`);
    } else if (err.request) {
        setError('Cannot connect to backend. Make sure Spring Boot is running on port 8080');
    }
    else {
        setError(err.message);
    }
    }
    finally {
    setLoading(false);
    }
};

return (
    <div className="travel-planner">
    <h2>🌍 AI Travel Itinerary Planner</h2>
    
    <form onSubmit={handleSubmit} className="travel-form">
        <div className="form-group">
          <label>Destination *</label>
        <input
            type="text"
            name="destination"
            value={formData.destination}
            onChange={handleChange}
            placeholder="e.g., Paris, Tokyo, New York"
            required
        />
        </div>

        <div className="form-group">
          <label>Number of Days *</label>
        <input
            type="number"
            name="days"
            value={formData.days}
            onChange={handleChange}
            min="1"
            max="30"
            required
        />
        </div>

        <div className="form-group">
        <label>Interests</label>
        <input
            type="text"
            name="interests"
            value={formData.interests}
            onChange={handleChange}
            placeholder="e.g., museums, food, shopping"
        />
        </div>

        <div className="form-group">
        <label>Budget</label>
        <select name="budget" value={formData.budget} onChange={handleChange}>
            <option value="budget">💰 Budget</option>
            <option value="moderate">💵 Moderate</option>
            <option value="luxury">💎 Luxury</option>
        </select>
        </div>

        <button type="submit" disabled={loading} className="submit-btn">
        {loading ? '✨ Generating...' : '✨ Generate Itinerary'}
        </button>
    </form>

    {error && (
        <div className="error-message">
        <h4 style={{ color: '#d32f2f' }}>❌ Error</h4>
        <p>{error}</p>
        </div>
    )}

    {itinerary && (
        <div className="itinerary-result">
        <h3>✅ Your Itinerary for {formData.destination}</h3>
        <div style={{ whiteSpace: 'pre-wrap' }}>
            {itinerary}
        </div>
        </div>
    )}
    </div>
);
};

export default TravelPlanner;