import React, { useState, useEffect } from 'react';
import { FiLoader } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api.service';

const TravelPlanner = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    destination: '',
    days: 5,
    interests: '',
    budget: 'moderate'
  });
  
  const [itinerary, setItinerary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [savedTrips, setSavedTrips] = useState([]);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('JWT Token exists:', !!token);
    
    if (!token) {
      setError('You must be logged in to use the travel planner');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } else {
      loadSavedTrips();
    }
  }, [navigate]);

  const loadSavedTrips = async () => {
    try {
      const response = await apiService.travel.getSavedItineraries();
      const responseData = response.data?.data || [];
      setSavedTrips(responseData);
    } catch (err) {
      console.error('Error loading saved trips:', err);
    }
  };

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
    setSaveSuccess('');

    if (!formData.destination.trim()) {
      setError('Destination is required');
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('token');
    
    if (!token) {
      setError('You are not authenticated. Please log in again.');
      setLoading(false);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      return;
    }

    try {
      console.log('📤 Sending request to /api/travel/itinerary');
      
      const response = await apiService.travel.getItinerary({
        destination: formData.destination.trim(),
        days: parseInt(formData.days),
        interests: formData.interests.trim() || 'general sightseeing',
        budget: formData.budget
      });

      const responseData = response.data;
      
      if (responseData && responseData.success === true && responseData.message) {
        setItinerary(responseData.message);
      } else if (typeof responseData === 'string') {
        setItinerary(responseData);
      } else {
        setItinerary(JSON.stringify(responseData, null, 2));
      }
    } catch (err) {
      console.error('❌ Error:', err);
      let errorMessage = 'Failed to generate itinerary. Please try again later.';
      if (err.response) {
        if (err.response.status === 401) {
          setError('Your session has expired. Please log in again.');
          localStorage.removeItem('token');
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        } else if (err.response.status === 403) {
          setError('You do not have permission to access this resource.');
        } else {
          setError(`Server error: ${err.response.data?.message || err.response.data || err.message}`);
        }
      } else if (err.request) {
        setError('Cannot connect to backend. Make sure Spring Boot is running on port 8080');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const saveItinerary = async () => {
    if (!itinerary) return;

    setSaveSuccess('');
    
    try {
      const saveData = {
        destination: formData.destination,
        days: formData.days,
        interests: formData.interests,
        budget: formData.budget,
        itineraryText: itinerary,
        tripName: `${formData.destination} - ${formData.days} days`
      };

      const response = await apiService.travel.saveItinerary(saveData);
      
      if (response.data?.success) {
        setSaveSuccess('✅ Trip saved successfully!');
        await loadSavedTrips();
      } else {
        setError('Failed to save trip');
      }
    } catch (err) {
      console.error('Save error:', err);
      setError('Error saving trip: ' + (err.response?.data?.error || err.message));
    }
  };

  const loadSavedTrip = (trip) => {
    setFormData({
      destination: trip.destination,
      days: trip.days,
      interests: trip.interests || '',
      budget: trip.budget || 'moderate'
    });
    setItinerary(trip.itineraryText);
    setShowSaved(false);
  };

  const deleteSavedTrip = async (id) => {
    try {
      await apiService.travel.deleteSavedItinerary(id);
      await loadSavedTrips(); // Refresh the list
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  return (
    <div className="travel-planner">
      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner">
              <FiLoader />
            </div>
            <h3>Please be patient</h3>
            <p className="loading-message">
              Planning your {formData.days}-day trip to {formData.destination || 'paradise'}...
            </p>
            <p className="loading-submessage">
              This may take a minute or two
            </p>
            <div className="loading-bar-container">
              <div className="loading-bar">
                <div className="loading-bar-progress"></div>
              </div>
            </div>
            <div className="loading-tips">
              <p className="loading-tip">✈️ Finding the best flights and accommodations</p>
              <p className="loading-tip">🏛️ Discovering hidden gems and local favorites</p>
              <p className="loading-tip">🍜 Curating authentic culinary experiences</p>
            </div>
          </div>
        </div>
      )}

      <div className="header">
        <h2>🌍 AI Travel Itinerary Planner</h2>
        <div className="header-buttons">
          {savedTrips.length > 0 && (
            <button 
              onClick={() => setShowSaved(!showSaved)} 
              className="saved-btn"
            >
              {showSaved ? 'Hide Saved' : `📚 Saved (${savedTrips.length})`}
            </button>
          )}
        </div>
      </div>

      {/* 🔥 NEW: Saved Trips List */}
      {showSaved && savedTrips.length > 0 && (
        <div className="saved-items">
          <h3>Your Saved Trips</h3>
          <div className="saved-list">
            {savedTrips.map(trip => (
              <div key={trip.id} className="saved-item">
                <div className="saved-item-header">
                  <span className="saved-item-title">{trip.tripName}</span>
                  <button 
                    className="delete-btn"
                    onClick={() => deleteSavedTrip(trip.id)}
                    title="Delete trip"
                  >
                    ❌
                  </button>
                </div>
                <div
                  className="saved-item-preview"
                  onClick={() => loadSavedTrip(trip)}
                >
                  <small>{trip.destination} • {trip.days} days</small>
                  <small>{new Date(trip.savedAt).toLocaleDateString()}</small>
                  localStorage.setItem('statsNeedsRefresh','true')
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
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
            disabled={loading}
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
            disabled={loading}
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
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Budget</label>
          <select name="budget" value={formData.budget} onChange={handleChange} disabled={loading}>
            <option value="budget">💰 Budget</option>
            <option value="moderate">💵 Moderate</option>
            <option value="luxury">💎 Luxury</option>
          </select>
        </div>

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? (
            <>
              <FiLoader className="spinning" /> Generating...
            </>
          ) : (
            '✨ Generate Itinerary'
          )}
        </button>
      </form>

      {error && (
        <div className="error-message">
          <h4 style={{ color: '#d32f2f' }}>❌ Error</h4>
          <p>{error}</p>
        </div>
      )}

      {saveSuccess && (
        <div className="success-message">
          {saveSuccess}
        </div>
      )}

      {itinerary && (
        <div className="itinerary-result">
          <div className="result-header">
            <h3>✅ Your Itinerary for {formData.destination}</h3>
            <button onClick={saveItinerary} className="save-btn">
              💾 Save Trip
            </button>
          </div>
          <div className="itinerary-content" style={{ whiteSpace: 'pre-wrap' }}>
            {itinerary}
          </div>
        </div>
      )}

      <style jsx>{`
        .travel-planner {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
          background: #f8fafc;
          min-height: 100vh;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        h2 {
          color: #2d3748;
          font-size: 2rem;
          margin: 0;
        }

        .header-buttons {
          display: flex;
          gap: 1rem;
        }

        .saved-btn {
          padding: 0.5rem 1rem;
          background: #4f46e5;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.3s ease;
        }

        .saved-btn:hover {
          background: #4338ca;
          transform: translateY(-2px);
        }

        .saved-items {
          margin-bottom: 2rem;
          background: white;
          border-radius: 20px;
          padding: 1.5rem;
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.05);
        }

        .saved-items h3 {
          color: #2d3748;
          margin-bottom: 1rem;
          font-size: 1.2rem;
        }

        .saved-list {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .saved-item {
          flex: 1;
          min-width: 200px;
          padding: 0.8rem;
          background: #f7fafc;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          transition: all 0.3s ease;
          display: flex;
          overflow: auto;
          flex-direction: column;
        }

        .saved-item:hover {
          border-color: #4f46e5;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(79, 70, 229, 0.1);
        }

        .saved-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          margin-bottom: 0.5rem;
        }

        .saved-item-title {
          font-weight: 600;
          color: #2d3748;
          font-size: 0.9rem;
        }

        .delete-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 2px 5px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .delete-btn:hover {
          background: #fee2e2;
          transform: scale(1.1);
        }

        .saved-item-preview {
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 4px;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .saved-item-preview:hover {
          background: #f1f5f9;
        }

        .travel-form {
          background: white;
          padding: 2rem;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        label {
          display: block;
          margin-bottom: 0.5rem;
          color: #4a5568;
          font-weight: 600;
          font-size: 0.95rem;
        }

        input, select {
          width: 100%;
          padding: 0.8rem;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          font-size: 1rem;
          transition: all 0.3s ease;
          background: white;
        }

        input:focus, select:focus {
          outline: none;
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        input:disabled, select:disabled {
          background: #f7fafc;
          cursor: not-allowed;
          opacity: 0.7;
        }

        .submit-btn {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, #4f46e5, #818cf8);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(79, 70, 229, 0.3);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .error-message {
          margin-top: 2rem;
          padding: 1rem;
          background: #fff5f5;
          border: 2px solid #fc8181;
          border-radius: 10px;
          color: #c53030;
        }

        .success-message {
          margin-top: 1rem;
          padding: 1rem;
          background: #d4edda;
          border: 2px solid #c3e6cb;
          border-radius: 10px;
          color: #155724;
          text-align: center;
          animation: fadeIn 0.3s ease;
        }

        .itinerary-result {
          margin-top: 2rem;
          background: white;
          border-radius: 20px;
          padding: 2rem;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        }

        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #e2e8f0;
        }

        .result-header h3 {
          color: #2d3748;
          margin: 0;
        }

        .save-btn {
          padding: 0.5rem 1rem;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .save-btn:hover {
          background: #059669;
          transform: translateY(-2px);
        }

        .itinerary-content {
          line-height: 1.8;
          color: #4a5568;
        }

        .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: fadeIn 0.3s ease;
        }

        .loading-content {
          background: white;
          padding: 3rem;
          border-radius: 30px;
          text-align: center;
          max-width: 600px;
          width: 90%;
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.3s ease;
        }

        .loading-spinner {
          font-size: 4rem;
          color: #4f46e5;
          margin-bottom: 1rem;
          animation: spin 1s linear infinite;
        }

        .loading-content h3 {
          font-size: 2rem;
          color: #2d3748;
          margin-bottom: 1rem;
        }

        .loading-message {
          font-size: 1.3rem;
          color: #4f46e5;
          margin-bottom: 0.5rem;
          font-weight: 600;
        }

        .loading-submessage {
          color: #718096;
          margin-bottom: 2rem;
          font-size: 1rem;
        }

        .loading-bar-container {
          margin: 2rem 0;
        }

        .loading-bar {
          width: 100%;
          height: 10px;
          background: #e2e8f0;
          border-radius: 10px;
          overflow: hidden;
        }

        .loading-bar-progress {
          height: 100%;
          background: linear-gradient(90deg, #4f46e5, #818cf8);
          border-radius: 10px;
          animation: progress 3s ease-in-out infinite;
          width: 0%;
        }

        .loading-tips {
          margin-top: 2rem;
          text-align: left;
          background: #f7fafc;
          padding: 1rem;
          border-radius: 15px;
        }

        .loading-tip {
          color: #4a5568;
          font-size: 0.95rem;
          margin: 0.5rem 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          animation: fadeInOut 2s ease-in-out infinite;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes progress {
          0% { width: 0%; }
          25% { width: 25%; }
          50% { width: 50%; }
          75% { width: 75%; }
          100% { width: 100%; }
        }

        @keyframes fadeInOut {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        @media (max-width: 768px) {
          .travel-planner {
            padding: 1rem;
          }

          .header {
            flex-direction: column;
            gap: 1rem;
          }

          .loading-content {
            padding: 2rem;
          }

          .loading-content h3 {
            font-size: 1.5rem;
          }

          .loading-message {
            font-size: 1.1rem;
          }

          .saved-list {
            flex-direction: column;
          }

          .saved-item {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default TravelPlanner;