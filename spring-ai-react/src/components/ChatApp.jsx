import React, { useState } from 'react';
import axios from 'axios';

const ChatApp = () => {
    const [prompt, setPrompt] = useState('');
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [chatHistory, setChatHistory] = useState([]);
    const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    
    // Add user message to chat history
    setChatHistory([...chatHistory, { type: 'user', text: prompt }]);
    
    try {
        const res = await axios.get('http://localhost:8080/ask-ai', {
        params: { prompt }
    });

    setResponse(res.data);
      // Add AI response to chat history
    setChatHistory(prev => [...prev, { type: 'ai', text: res.data }]);
    setPrompt('');
    } catch (error) {
    console.error('Error:', error);
    setChatHistory(prev => [...prev, { type: 'ai', text: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
    setLoading(false);
    }
};

return (
    <div className="chat-app">
    <h2>💬 AI Chat Assistant</h2>
    <div className="chat-container">
        <div className="chat-history">
        {chatHistory.length === 0 ? (
            <div className="welcome-message">
        <p>👋 Hello! I'm your AI assistant. Ask me anything about travel, recipes, or any other topic!</p>
            </div>
        ) : (
            chatHistory.map((msg, index) => (
            <div key={index} className={`message ${msg.type}`}>
                <div className="message-content">
                <strong>{msg.type === 'user' ? 'You:' : 'AI:'}</strong>
                <p>{msg.text}</p>
                </div>
            </div>
            ))
        )}
        </div>
        
        <form onSubmit={handleSubmit} className="chat-input-form">
        <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask me anything..."
            disabled={loading}
        />
        <button type="submit" disabled={loading}>
            {loading ? '...' : 'Send'}
        </button>
        </form>
    </div>
    </div>
);
};

export default ChatApp;