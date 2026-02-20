import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    FiLogOut,
    FiMessageCircle,
    FiCoffee,
    FiUser,
    FiMail,
    FiLoader,
    FiBookOpen,
    FiRefreshCw
} from 'react-icons/fi';
import { GiCommercialAirplane } from 'react-icons/gi';
import apiService from '../services/api.service';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(null);
    const [stats, setStats] = useState({
        trips: 0,
        chats: 0,
        recipes: 0
    });
    const [statsLoading, setStatsLoading] = useState(true);

    // Load statistics on component mount and when page gains focus
    useEffect(() => {
        loadStatistics();
        
        // Listen for storage events (triggered when recipe is saved)
        const handleStorageChange = (e) => {
            if (e.key === 'statsNeedsRefresh') {
                loadStatistics();
                localStorage.removeItem('statsNeedsRefresh');
            }
        };
        
        window.addEventListener('storage', handleStorageChange);
        
        // Refresh when page comes into focus
        const handleFocus = () => {
            loadStatistics();
        };
        
        window.addEventListener('focus', handleFocus);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    // Also refresh when navigating back to dashboard
    useEffect(() => {
        const checkForRefresh = () => {
            if (localStorage.getItem('statsNeedsRefresh') === 'true') {
                loadStatistics();
                localStorage.removeItem('statsNeedsRefresh');
            }
        };
        
        // Check immediately
        checkForRefresh();
        
        // Set up interval to check periodically (every 2 seconds)
        const interval = setInterval(checkForRefresh, 2000);
        
        return () => clearInterval(interval);
    }, []);

    const loadStatistics = async () => {
        setStatsLoading(true);
        try {
            const userId = localStorage.getItem('userId');
            console.log('Loading stats for user:', userId);
            // Load trips count
            const tripsResponse = await apiService.travel.getSavedItineraries();
            const tripsData = tripsResponse.data?.data || [];
            
            // Load chats count
            const chatsResponse = await apiService.chat.getHistory(userId);
            const chatsData = chatsResponse.data?.data || [];
            
            // Load recipes count
            const recipesResponse = await apiService.recipe.getSavedRecipes(userId);
            const recipesData = recipesResponse.data?.data || [];

            setStats({
                trips: tripsData.length,
                chats: chatsData.length,
                recipes: recipesData.length
            });
        } catch (error) {
            console.error('Error loading statistics:', error);
        } finally {
            setStatsLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleFeatureClick = (feature, path) => {
        setLoading(feature);
        
        setTimeout(() => {
            setLoading(null);
            navigate(path);
        }, 3000);
    };

    const features = [
        {
            id: 'travel',
            icon: <GiCommercialAirplane className="feature-icon" />,
            title: 'Travel Planner',
            description: 'Plan your next adventure with AI-powered recommendations',
            color: '#4f46e5',
            path: '/travel',
            loadingText: 'Planning your dream vacation...',
            count: stats.trips,
            countLabel: 'Saved Trips'
        },
        {
            id: 'chat',
            icon: <FiMessageCircle className="feature-icon" />,
            title: 'AI Chat',
            description: 'Have intelligent conversations with our AI assistant',
            color: '#0891b2',
            path: '/chat',
            loadingText: 'Waking up the AI...',
            count: stats.chats,
            countLabel: 'Conversations'
        },
        {
            id: 'recipes',
            icon: <FiCoffee className="feature-icon" />,
            title: 'Recipe Generator',
            description: 'Discover delicious recipes tailored to your taste',
            color: '#b45309',
            path: '/recipe-creator',
            loadingText: 'Gathering fresh ingredients...',
            count: stats.recipes,
            countLabel: 'Saved Recipes'
        }
    ];

    return (
        <>
            {/* Purple Header */}
            <div className="app-header">
                <div className="header-content">
                    <h1 className="app-title">AI Trivia</h1>
                    <button onClick={handleLogout} className="logout-btn">
                        <FiLogOut /> Sign Out
                    </button>
                </div>
            </div>

            <div className="dashboard-container">
                {/* Welcome Section - New! */}
                <div className="welcome-banner">
                    <div className="welcome-content">
                        <div className="welcome-avatar">
                            <FiUser />
                        </div>
                        <div className="welcome-text">
                            <h2>Welcome back, <span className="username-highlight">{user?.username || 'Explorer'}</span>!</h2>
                            <p className="welcome-subtitle">Ready to explore something new today?</p>
                        </div>
                    </div>
                </div>

                {/* 1. EXPLORE AI FEATURES SECTION - First */}
                <div className="features-section">
                    <h2 className="section-title">Explore AI Features</h2>
                    <div className="features-grid">
                        {features.map((feature) => (
                            <div
                                key={feature.id}
                                className={`feature-card ${loading === feature.id ? 'loading' : ''}`}
                                onClick={() => !loading && handleFeatureClick(feature.id, feature.path)}
                                style={{ '--feature-color': feature.color }}
                            >
                                {loading === feature.id ? (
                                    <div className="feature-loading">
                                        <FiLoader className="spinning" />
                                        <p>Loading...</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="feature-icon-wrapper" style={{ backgroundColor: `${feature.color}20` }}>
                                            {feature.icon}
                                        </div>
                                        <h3>{feature.title}</h3>
                                        <p>{feature.description}</p>
                                        
                                        <div className="feature-stats">
                                            <div className="feature-stat">
                                                <FiBookOpen />
                                                <span>{feature.count} {feature.countLabel}</span>
                                            </div>
                                        </div>
                                        
                                        <button
                                            className="feature-btn"
                                            style={{ backgroundColor: feature.color }}
                                            disabled={loading}
                                        >
                                            {feature.title === 'Travel Planner' ? 'Plan Trip →' :
                                             feature.title === 'AI Chat' ? 'Start Chat →' :
                                             feature.title === 'Recipe Generator' ? 'Find Recipes →' : 'Explore →'}
                                        </button>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. DATABASE STATISTICS SECTION - Second */}
                <div className="stats-section">
                    <h2 className="section-title">Your Saved Content</h2>
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: '#4f46e5', color: 'white' }}>
                                <GiCommercialAirplane />
                            </div>
                            <div className="stat-content">
                                <span className="stat-label">Saved Trips</span>
                                <span className="stat-value">
                                    {statsLoading ? <FiLoader className="spinning-small" /> : stats.trips}
                                </span>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: '#0891b2', color: 'white' }}>
                                <FiMessageCircle />
                            </div>
                            <div className="stat-content">
                                <span className="stat-label">Chat History</span>
                                <span className="stat-value">
                                    {statsLoading ? <FiLoader className="spinning-small" /> : stats.chats}
                                </span>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: '#b45309', color: 'white' }}>
                                <FiCoffee />
                            </div>
                            <div className="stat-content">
                                <span className="stat-label">Saved Recipes</span>
                                <span className="stat-value">
                                    {statsLoading ? <FiLoader className="spinning-small" /> : stats.recipes}
                                </span>
                            </div>
                        </div>

                        <div className="refresh-wrapper">
                            <button 
                                className="refresh-btn"
                                onClick={loadStatistics}
                                disabled={statsLoading}
                            >
                                <FiRefreshCw className={statsLoading ? 'spinning-small' : ''} />
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>

                {/* 3. QUICK ACTIONS SECTION - Third */}
                <div className="quick-actions">
                    <h2 className="section-title">Quick Actions</h2>
                    <div className="actions-grid">
                        {features.map((feature) => (
                            <button
                                key={feature.id}
                                className={`action-btn ${loading === feature.id ? 'loading' : ''}`}
                                onClick={() => !loading && handleFeatureClick(feature.id, feature.path)}
                                disabled={loading}
                            >
                                {loading === feature.id ? (
                                    <>
                                        <FiLoader className="spinning" /> Loading...
                                    </>
                                ) : (
                                    <>
                                        {feature.icon}
                                        {feature.title === 'Travel Planner' ? 'Plan a Trip' :
                                         feature.title === 'AI Chat' ? 'Start Chat' :
                                         feature.title === 'Recipe Generator' ? 'Find Recipes' : 'Explore'}
                                    </>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Loading Overlay */}
                {loading && (
                    <div className="loading-overlay">
                        <div className="loading-content">
                            <div className="loading-spinner">
                                <FiLoader />
                            </div>
                            <h3>Please be patient</h3>
                            <p className="loading-message">
                                {features.find(f => f.id === loading)?.loadingText}
                            </p>
                            <p className="loading-submessage">
                                The generation may take several minutes
                            </p>
                            <div className="loading-bar-container">
                                <div className="loading-bar">
                                    <div className="loading-bar-progress"></div>
                                </div>
                            </div>
                            <p className="loading-tip">
                                Tip: AI generation takes time for quality results ✨
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                /* Purple Header */
                .app-header {
                    background: #4f46e5;
                    padding: 1rem 0;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }

                .header-content {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 2rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .app-title {
                    color: white;
                    font-size: 1.8rem;
                    font-weight: 700;
                    margin: 0;
                    letter-spacing: -0.5px;
                }

                /* Redesigned Logout Button */
                .logout-btn {
                    background: white;
                    color: #4f46e5;
                    border: none;
                    padding: 0.6rem 1.5rem;
                    border-radius: 8px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }

                .logout-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                    background: #f8f9fa;
                }

                .dashboard-container {
                    min-height: 100vh;
                    background: #f3f4f6;
                    padding: 2rem 0;
                }

                /* Welcome Banner - New Styles */
                .welcome-banner {
                    max-width: 1200px;
                    margin: 0 auto 2rem auto;
                    padding: 0 2rem;
                }

                .welcome-content {
                    background: white;
                    border-radius: 20px;
                    padding: 2rem;
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
                    border: 1px solid #e5e7eb;
                }

                .welcome-avatar {
                    width: 70px;
                    height: 70px;
                    background: linear-gradient(135deg, #4f46e5, #818cf8);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2rem;
                    color: white;
                    box-shadow: 0 10px 20px rgba(79, 70, 229, 0.2);
                }

                .welcome-text h2 {
                    font-size: 2rem;
                    margin: 0 0 0.5rem 0;
                    color: #1f2937;
                }

                .username-highlight {
                    color: #4f46e5;
                    font-weight: 700;
                    background: linear-gradient(135deg, #4f46e5, #818cf8);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .welcome-subtitle {
                    color: #6b7280;
                    font-size: 1.1rem;
                    margin: 0;
                }

                /* Section Titles */
                .section-title {
                    font-size: 2rem;
                    color: #1f2937;
                    margin-bottom: 2rem;
                    font-weight: 700;
                }

                /* Features Section */
                .features-section {
                    max-width: 1200px;
                    margin: 0 auto 4rem auto;
                    padding: 0 2rem;
                }

                .features-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 2rem;
                }

                .feature-card {
                    background: white;
                    padding: 2rem;
                    border-radius: 20px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
                    cursor: pointer;
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                    min-height: 320px;
                    display: flex;
                    flex-direction: column;
                }

                .feature-card.loading {
                    opacity: 0.7;
                    pointer-events: none;
                }

                .feature-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 5px;
                    background: var(--feature-color);
                }

                .feature-card:hover:not(.loading) {
                    transform: translateY(-10px);
                    box-shadow: 0 20px 60px rgba(79, 70, 229, 0.2);
                }

                .feature-icon-wrapper {
                    width: 60px;
                    height: 60px;
                    border-radius: 15px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2rem;
                    margin-bottom: 1.5rem;
                }

                .feature-card h3 {
                    font-size: 1.5rem;
                    margin-bottom: 1rem;
                    color: #1f2937;
                }

                .feature-card p {
                    color: #6b7280;
                    margin-bottom: 1rem;
                    line-height: 1.6;
                    flex: 1;
                }

                .feature-stats {
                    margin-bottom: 1.5rem;
                }

                .feature-stat {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: #4f46e5;
                    font-size: 0.9rem;
                }

                .feature-btn {
                    padding: 0.8rem 1.5rem;
                    border: none;
                    border-radius: 10px;
                    color: white;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    width: 100%;
                    margin-top: auto;
                }

                .feature-btn:hover:not(:disabled) {
                    transform: scale(1.05);
                    filter: brightness(110%);
                }

                .feature-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .feature-loading {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    min-height: 200px;
                }

                .feature-loading .spinning {
                    font-size: 3rem;
                    color: var(--feature-color);
                    margin-bottom: 1rem;
                }

                /* Stats Section */
                .stats-section {
                    max-width: 1200px;
                    margin: 0 auto 4rem auto;
                    padding: 0 2rem;
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 1.5rem;
                }

                .stat-card {
                    background: white;
                    border-radius: 15px;
                    padding: 1.5rem;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    transition: all 0.3s ease;
                }

                .stat-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 20px -8px rgba(79, 70, 229, 0.3);
                }

                .stat-icon {
                    width: 55px;
                    height: 55px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2rem;
                }

                .stat-content {
                    display: flex;
                    flex-direction: column;
                }

                .stat-label {
                    font-size: 0.9rem;
                    color: #6b7280;
                }

                .stat-value {
                    font-size: 2rem;
                    font-weight: 700;
                    color: #1f2937;
                }

                /* Refresh Button */
                .refresh-wrapper {
                    display: flex;
                    align-items: center;
                }

                .refresh-btn {
                    background: #4f46e5;
                    color: white;
                    border: none;
                    padding: 0.8rem 1.2rem;
                    border-radius: 10px;
                    font-size: 0.95rem;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    transition: all 0.3s ease;
                    width: 100%;
                    justify-content: center;
                    box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.3);
                }

                .refresh-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 15px -6px rgba(79, 70, 229, 0.5);
                    background: #6366f1;
                }

                .refresh-btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                .spinning-small {
                    animation: spin 1s linear infinite;
                }

                /* Quick Actions */
                .quick-actions {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 2rem;
                }

                .actions-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1.5rem;
                }

                .action-btn {
                    padding: 1.5rem;
                    background: white;
                    border: none;
                    border-radius: 15px;
                    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
                    font-size: 1.2rem;
                    font-weight: 600;
                    color: #4b5563;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.8rem;
                    transition: all 0.3s ease;
                }

                .action-btn:hover:not(:disabled) {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 30px rgba(79, 70, 229, 0.2);
                    color: #4f46e5;
                }

                .action-btn.loading {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                .action-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                /* Loading Overlay */
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
                    max-width: 500px;
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
                    font-size: 1.2rem;
                    color: #4a5568;
                    margin-bottom: 0.5rem;
                    font-weight: 500;
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

                .loading-tip {
                    color: #a0aec0;
                    font-size: 0.9rem;
                    margin-top: 1rem;
                    font-style: italic;
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

                @media (max-width: 768px) {
                    .header-content {
                        padding: 0 1rem;
                    }

                    .app-title {
                        font-size: 1.5rem;
                    }

                    .welcome-content {
                        flex-direction: column;
                        text-align: center;
                        padding: 1.5rem;
                    }

                    .welcome-text h2 {
                        font-size: 1.5rem;
                    }

                    .stats-grid {
                        grid-template-columns: 1fr;
                    }

                    .section-title {
                        font-size: 1.5rem;
                    }

                    .loading-content {
                        padding: 2rem;
                    }

                    .loading-content h3 {
                        font-size: 1.5rem;
                    }
                }
            `}</style>
        </>
    );
};

export default Dashboard;