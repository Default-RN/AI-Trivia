import React, { useState, useRef, useEffect } from 'react';
import { FiLoader, FiSend, FiUser, FiCpu, FiArrowLeft } from 'react-icons/fi';
import apiService from '../services/api.service';

const ChatApp = () => {
  const [prompt, setPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedSessions, setSavedSessions] = useState([]);
  const [showSaved, setShowSaved] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [viewingSession, setViewingSession] = useState(null);
  const [sessionMessages, setSessionMessages] = useState([]);
  const [loadingSession, setLoadingSession] = useState(false);
  const chatEndRef = useRef(null);

  // Load saved sessions from database
  useEffect(() => {
    loadSavedSessions();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, sessionMessages]);

  const loadSavedSessions = async () => {
    try {
      const response = await apiService.chat.getHistory();
      const responseData = response.data?.data || [];
      setSavedSessions(responseData);
    } catch (err) {
      console.error('Error loading saved sessions:', err);
    }
  };

  const addMessage = (type, text, error = false) => {
    const newMessage = {
      type,
      text,
      error,
      timestamp: new Date().toISOString(),
      id: Date.now() + Math.random()
    };
    setChatHistory(prev => [...prev, newMessage]);
    return newMessage;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    const userPrompt = prompt.trim();
    setPrompt('');
    
    // Add user message
    addMessage('user', userPrompt);
    setLoading(true);

    try {
      const response = await apiService.chat.sendMessage(userPrompt);
      
      const responseData = response.data;
      let aiResponse = '';
      
      if (responseData && responseData.success === true && responseData.message) {
        aiResponse = responseData.message;
      } else if (typeof responseData === 'string') {
        aiResponse = responseData;
      } else {
        aiResponse = JSON.stringify(responseData, null, 2);
      }
      
      addMessage('ai', aiResponse);
      
      // Save to database with session ID
      const sessionId = currentSessionId || Date.now().toString();
      if (!currentSessionId) {
        setCurrentSessionId(sessionId);
      }
      
      await apiService.chat.saveMessage({
        prompt: userPrompt,
        sessionId: sessionId
      });
      
      // Refresh saved sessions
      await loadSavedSessions();
      
    } catch (error) {
      console.error('Chat error:', error);
      
      let errorMessage = 'Sorry, I encountered an error. Please try again.';
      if (!navigator.onLine) {
        errorMessage = 'You are offline. Please check your internet connection.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      addMessage('ai', errorMessage, true);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 NEW: Load full chat session
  const loadChatSession = async (sessionId) => {
    setLoadingSession(true);
    try {
      const response = await apiService.chat.getChatSession(sessionId);
      const messages = response.data?.data || [];
      
      // Format messages for display
      const formattedMessages = messages.map(msg => ({
        type: 'user',
        text: msg.userMessage,
        timestamp: msg.timestamp,
        id: `user-${msg.id}`
      })).concat(messages.map(msg => ({
        type: 'ai',
        text: msg.aiResponse,
        timestamp: msg.timestamp,
        id: `ai-${msg.id}`
      }))).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      setSessionMessages(formattedMessages);
      setViewingSession(sessionId);
    } catch (err) {
      console.error('Error loading chat session:', err);
      alert('Failed to load chat session');
    } finally {
      setLoadingSession(false);
    }
  };

  // 🔥 NEW: Exit viewing session
  const exitViewSession = () => {
    setViewingSession(null);
    setSessionMessages([]);
  };

  // 🔥 NEW: Delete a saved session
  const deleteSavedSession = async (sessionId, e) => {
    e.stopPropagation();
    if (window.confirm('Delete this chat session?')) {
      try {
        // You'll need to add this endpoint to your backend
        // await apiService.chat.deleteSession(sessionId);
        await loadSavedSessions();
        if (viewingSession === sessionId) {
          exitViewSession();
        }
      } catch (err) {
        console.error('Delete error:', err);
      }
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setPrompt(suggestion);
  };

  const clearHistory = () => {
    setChatHistory([]);
    setCurrentSessionId(null);
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString([], { 
      month: 'short',
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Group sessions by date
  const groupSessionsByDate = () => {
    const groups = {};
    savedSessions.forEach(session => {
      const date = new Date(session.timestamp).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(session);
    });
    return groups;
  };

  return (
    <div className="chat-app">
      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner">
              <FiLoader />
            </div>
            <h3>Please be patient</h3>
            <p className="loading-message">
              AI is thinking about your question...
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
              <p className="loading-tip">🧠 Processing your request</p>
              <p className="loading-tip">🔍 Searching knowledge base</p>
              <p className="loading-tip">✨ Crafting the perfect response</p>
            </div>
          </div>
        </div>
      )}

      <div className="chat-header">
        <h2>💬 AI Chat Assistant</h2>
        <div className="header-buttons">
          <button 
            onClick={() => setShowSaved(!showSaved)} 
            className="saved-btn"
          >
            {showSaved ? 'Hide Saved' : `📚 Saved (${savedSessions.length})`}
          </button>
          {chatHistory.length > 0 && !viewingSession && (
            <button onClick={clearHistory} className="clear-history-btn">
              New Chat
            </button>
          )}
          {viewingSession && (
            <button onClick={exitViewSession} className="back-btn">
              <FiArrowLeft /> Back to Chat
            </button>
          )}
        </div>
      </div>

      <div className="chat-container">
        {/* Saved Sessions Sidebar */}
        {showSaved && (
          <div className="saved-sidebar">
            <h3>Saved Conversations</h3>
            {loadingSession ? (
              <div className="sidebar-loading">
                <FiLoader className="spinning" />
                <p>Loading...</p>
              </div>
            ) : (
              <div className="sessions-list">
                {Object.entries(groupSessionsByDate()).map(([date, sessions]) => (
                  <div key={date} className="date-group">
                    <div className="date-header">{date}</div>
                    {sessions.map(session => (
                      <div
                        key={session.id}
                        className={`session-item ${viewingSession === session.sessionId ? 'active' : ''}`}
                        onClick={() => loadChatSession(session.sessionId)}
                      >
                        <div className="session-preview">
                          <span className="session-time">
                            {new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="session-message">
                            {session.userMessage.substring(0, 40)}...
                          </span>
                        </div>
                        <button 
                          className="delete-session-btn"
                          onClick={(e) => deleteSavedSession(session.sessionId, e)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Chat Area */}
        <div className="chat-main">
          <div className="chat-history">
            {viewingSession ? (
              /* Displaying saved session */
              sessionMessages.length > 0 ? (
                sessionMessages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`message ${msg.type}`}
                  >
                    <div className="message-avatar">
                      {msg.type === 'user' ? <FiUser /> : <FiCpu />}
                    </div>
                    <div className="message-content">
                      <div className="message-header">
                        <strong>{msg.type === 'user' ? 'You' : 'AI Assistant'}</strong>
                        <span className="message-time">
                          {formatTimestamp(msg.timestamp)}
                        </span>
                      </div>
                      <p style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-session">
                  <p>No messages in this session</p>
                </div>
              )
            ) : chatHistory.length === 0 ? (
              /* Welcome message */
              <div className="welcome-message">
                <div className="ai-avatar">
                  <FiCpu />
                </div>
                <p>👋 Hello! I'm your AI assistant. Ask me anything about travel, recipes, or any other topic!</p>
                <div className="suggestion-chips">
                  <button 
                    className="suggestion-chip"
                    onClick={() => handleSuggestionClick("What's a good 3-day itinerary for Paris?")}
                    disabled={loading}
                  >
                    🗼 Paris itinerary
                  </button>
                  <button 
                    className="suggestion-chip"
                    onClick={() => handleSuggestionClick("Give me a recipe with chicken and rice")}
                    disabled={loading}
                  >
                    🍗 Chicken recipe
                  </button>
                  <button 
                    className="suggestion-chip"
                    onClick={() => handleSuggestionClick("What's the capital of Japan?")}
                    disabled={loading}
                  >
                    🗾 Japan facts
                  </button>
                </div>
              </div>
            ) : (
              /* Current chat */
              chatHistory.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`message ${msg.type} ${msg.error ? 'error' : ''}`}
                >
                  <div className="message-avatar">
                    {msg.type === 'user' ? <FiUser /> : <FiCpu />}
                  </div>
                  <div className="message-content">
                    <div className="message-header">
                      <strong>{msg.type === 'user' ? 'You' : 'AI Assistant'}</strong>
                      <span className="message-time">
                        {formatTimestamp(msg.timestamp)}
                      </span>
                    </div>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>
          
          {/* Input Form - Hide when viewing saved session */}
          {!viewingSession && (
            <form onSubmit={handleSubmit} className="chat-input-form">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask me anything..."
                disabled={loading}
                className="chat-input"
                autoComplete="off"
              />
              <button 
                type="submit" 
                disabled={loading || !prompt.trim()} 
                className="send-btn"
              >
                {loading ? <FiLoader className="spinning" /> : <FiSend />}
              </button>
            </form>
          )}
        </div>
      </div>

      <style jsx>{`
        .chat-app {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          background: #f8fafc;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .chat-header {
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

        .clear-history-btn, .back-btn {
          padding: 0.5rem 1rem;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
        }

        .clear-history-btn:hover, .back-btn:hover {
          background: #059669;
          transform: translateY(-2px);
        }

        .chat-container {
          display: flex;
          gap: 1rem;
          height: 70vh;
          background: white;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        /* Saved Sidebar */
        .saved-sidebar {
          width: 280px;
          background: #f8fafc;
          border-right: 2px solid #e2e8f0;
          padding: 1rem;
          overflow-y: auto;
        }

        .saved-sidebar h3 {
          color: #2d3748;
          margin-bottom: 1rem;
          font-size: 1.1rem;
        }

        .sidebar-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          color: #4f46e5;
        }

        .date-group {
          margin-bottom: 1.5rem;
        }

        .date-header {
          font-size: 0.8rem;
          color: #64748b;
          margin-bottom: 0.5rem;
          font-weight: 600;
        }

        .session-item {
          padding: 0.8rem;
          border-radius: 8px;
          margin-bottom: 0.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 2px solid transparent;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .session-item:hover {
          background: white;
          border-color: #4f46e5;
        }

        .session-item.active {
          background: white;
          border-color: #4f46e5;
          box-shadow: 0 2px 8px rgba(79, 70, 229, 0.2);
        }

        .session-preview {
          flex: 1;
          overflow: hidden;
        }

        .session-time {
          font-size: 0.7rem;
          color: #64748b;
          display: block;
          margin-bottom: 0.2rem;
        }

        .session-message {
          font-size: 0.85rem;
          color: #1e293b;
          font-weight: 500;
          display: block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .delete-session-btn {
          background: none;
          border: none;
          color: #94a3b8;
          font-size: 1.2rem;
          cursor: pointer;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .delete-session-btn:hover {
          background: #fee2e2;
          color: #ef4444;
        }

        /* Chat Main Area */
        .chat-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: white;
        }

        .chat-history {
          flex: 1;
          overflow-y: auto;
          padding: 2rem;
        }

        .empty-session {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #94a3b8;
          font-size: 1.1rem;
        }

        .welcome-message {
          text-align: center;
          padding: 2rem;
          color: #4a5568;
        }

        .ai-avatar {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #0891b2, #06b6d4);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
          color: white;
          font-size: 1.8rem;
        }

        .welcome-message p {
          font-size: 1.1rem;
          margin-bottom: 2rem;
          line-height: 1.6;
        }

        .suggestion-chips {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .suggestion-chip {
          padding: 0.8rem 1.5rem;
          background: #f1f5f9;
          border: 2px solid #e2e8f0;
          border-radius: 50px;
          color: #475569;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .suggestion-chip:hover:not(:disabled) {
          background: #0891b2;
          border-color: #0891b2;
          color: white;
          transform: translateY(-2px);
        }

        .suggestion-chip:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .message {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
          animation: slideIn 0.3s ease;
        }

        .message.user {
          flex-direction: row-reverse;
        }

        .message-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          flex-shrink: 0;
        }

        .message.user .message-avatar {
          background: #4f46e5;
          color: white;
        }

        .message.ai .message-avatar {
          background: linear-gradient(135deg, #0891b2, #06b6d4);
          color: white;
        }

        .message-content {
          background: white;
          padding: 1rem 1.5rem;
          border-radius: 15px;
          max-width: 70%;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }

        .message.user .message-content {
          background: #4f46e5;
          color: white;
        }

        .message.ai .message-content {
          background: white;
          color: #2d3748;
        }

        .message.error .message-content {
          background: #fee2e2;
          color: #dc2626;
          border: 2px solid #fecaca;
        }

        .message-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
        }

        .message.user .message-header {
          color: rgba(255, 255, 255, 0.9);
        }

        .message-time {
          font-size: 0.8rem;
          opacity: 0.7;
        }

        .message p {
          line-height: 1.6;
          margin: 0;
          word-break: break-word;
        }

        .chat-input-form {
          display: flex;
          padding: 1rem;
          background: white;
          border-top: 2px solid #e2e8f0;
          gap: 0.5rem;
        }

        .chat-input {
          flex: 1;
          padding: 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 15px;
          font-size: 1rem;
          transition: all 0.3s ease;
        }

        .chat-input:focus {
          outline: none;
          border-color: #0891b2;
          box-shadow: 0 0 0 3px rgba(8, 145, 178, 0.1);
        }

        .chat-input:disabled {
          background: #f1f5f9;
          cursor: not-allowed;
        }

        .send-btn {
          width: 50px;
          height: 50px;
          border-radius: 15px;
          background: linear-gradient(135deg, #0891b2, #06b6d4);
          color: white;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .send-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(8, 145, 178, 0.3);
        }

        .send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
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
          max-width: 500px;
          width: 90%;
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.3s ease;
        }

        .loading-spinner {
          font-size: 4rem;
          color: #0891b2;
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
          background: linear-gradient(90deg, #0891b2, #06b6d4);
          border-radius: 10px;
          animation: progress 3s ease-in-out infinite;
          width: 0%;
        }

        .loading-tips {
          margin-top: 2rem;
          text-align: left;
          background: #e0f2fe;
          padding: 1rem;
          border-radius: 15px;
        }

        .loading-tip {
          color: #0369a1;
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

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .chat-app {
            padding: 1rem;
          }

          .chat-container {
            flex-direction: column;
            height: auto;
          }

          .saved-sidebar {
            width: 100%;
            max-height: 200px;
          }

          .message-content {
            max-width: 85%;
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

          .suggestion-chips {
            flex-direction: column;
          }

          .suggestion-chip {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default ChatApp;