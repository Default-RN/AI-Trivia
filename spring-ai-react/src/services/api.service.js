import axios from 'axios';

class ApiService {
  constructor() {
    this.baseURL = 'http://localhost:8080';
    this.setupAxios();
  }

  setupAxios() {
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Request interceptor for auth
    this.api.interceptors.request.use(config => {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // 🔥 FIX: Add userId to all GET requests as query parameter
      if (config.method === 'get' && userId) {
        if (config.url.includes('/saved') || config.url.includes('/history')) {
          config.params = {
            ...config.params,
            userId: userId
          };
        }
      }
      
      // 🔥 FIX: Add userId to POST request bodies
      if (config.method === 'post' && config.data && userId) {
        config.data.userId = userId;
      }
      
      return config;
    });
  }

  // Travel module endpoints
  travel = {
    getItinerary: (params) => 
      this.api.get('/api/travel/itinerary', { params }),
    
    saveItinerary: (data) => 
      this.api.post('/api/travel/save', data),
    
    getSavedItineraries: (userId) => 
      this.api.get('/api/travel/saved', { params: { userId } }),
    
    deleteSavedItinerary: (id, userId) => 
      this.api.delete(`/api/travel/saved/${id}`, { params: { userId } })
  };

  // Chat module endpoints
  chat = {
    sendMessage: (prompt) => 
      this.api.get('/api/chat/ask', { params: { prompt } }),
    
    saveMessage: (data) => 
      this.api.post('/api/chat/save', data),
    
    getHistory: (userId) => 
      this.api.get('/api/chat/history', { params: { userId } }),
    
    getChatSession: (sessionId, userId) => 
      this.api.get(`/api/chat/session/${sessionId}`, { params: { userId } })
  };

  // Recipe module endpoints
  recipe = {
    generate: (params) => 
      this.api.get('/api/recipes/create', { params }),
    
    saveRecipe: (data) => 
      this.api.post('/api/recipes/save', data),
    
    getSavedRecipes: (userId) => 
      this.api.get('/api/recipes/saved', { params: { userId } }),
    
    deleteSavedRecipe: (id, userId) => 
      this.api.delete(`/api/recipes/saved/${id}`, { params: { userId } })
  };
}

export default new ApiService();