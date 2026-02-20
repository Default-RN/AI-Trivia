import React, { useState, useEffect } from 'react';
import { FiLoader } from 'react-icons/fi';
import apiService from '../services/api.service';

const RecipeGenerator = () => {
  const [formData, setFormData] = useState({
    ingredients: '',
    cuisine: 'any',
    dietaryRestrictions: ''
  });
  const [recipe, setRecipe] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [saveSuccess, setSaveSuccess] = useState('');

  // Load saved recipes from database on mount
  useEffect(() => {
    loadSavedRecipes();
  }, []);

  const loadSavedRecipes = async () => {
    try {
      const response = await apiService.recipe.getSavedRecipes();
      const responseData = response.data?.data || [];
      setSavedRecipes(responseData);
    } catch (err) {
      console.error('Error loading saved recipes:', err);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const validateForm = () => {
    if (!formData.ingredients.trim()) {
      setError('Please enter at least one ingredient');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setRecipe('');
    setSaveSuccess('');

    try {
      const response = await apiService.recipe.generate({
        ingredients: formData.ingredients,
        cuisine: formData.cuisine,
        dietaryRestrictions: formData.dietaryRestrictions
      });
      
      const responseData = response.data;
      
      if (responseData && responseData.success === true && responseData.message) {
        setRecipe(responseData.message);
      } else if (typeof responseData === 'string') {
        setRecipe(responseData);
      } else {
        setRecipe(JSON.stringify(responseData, null, 2));
      }
    } catch (err) {
      console.error('Recipe error:', err);
      
      let errorMessage = 'Failed to generate recipe. Please try again.';
      if (!navigator.onLine) {
        errorMessage = 'You are offline. Please check your internet connection.';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const saveRecipe = async () => {
    if (!recipe) return;

    setSaveSuccess('');
    
    try {
      const saveData = {
        recipeText: recipe,
        ingredients: formData.ingredients,
        cuisine: formData.cuisine,
        dietaryRestrictions: formData.dietaryRestrictions,
        recipeName: `${getCuisineName(formData.cuisine)} Recipe - ${new Date().toLocaleDateString()}`
      };

      const response = await apiService.recipe.saveRecipe(saveData);
      
      if (response.data?.success) {
        setSaveSuccess('✅ Recipe saved successfully!');
        
        // Signal dashboard to refresh stats
        localStorage.setItem('statsNeedsRefresh', 'true');
        
        // Refresh saved recipes list
        await loadSavedRecipes();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSaveSuccess(''), 3000);
      } else {
        setError('Failed to save recipe');
      }
    } catch (err) {
      console.error('Save error:', err);
      setError('Error saving recipe: ' + (err.response?.data?.error || err.message));
    }
  };

  const deleteSavedRecipe = async (id) => {
    try {
      await apiService.recipe.deleteSavedRecipe(id);
      await loadSavedRecipes(); // Refresh the list
      localStorage.setItem('statsNeedsRefresh', 'true'); // Signal dashboard to refresh
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const clearForm = () => {
    setFormData({
      ingredients: '',
      cuisine: 'any',
      dietaryRestrictions: ''
    });
    setRecipe('');
    setError('');
    setSaveSuccess('');
  };

  const getCuisineEmoji = (cuisine) => {
    const emojis = {
      'any': '🌍',
      'italian': '🍝',
      'mexican': '🌮',
      'indian': '🍛',
      'chinese': '🥡',
      'japanese': '🍣',
      'thai': '🥘',
      'mediterranean': '🫒'
    };
    return emojis[cuisine] || '🍳';
  };

  const getCuisineName = (cuisine) => {
    const names = {
      'any': 'Any Cuisine',
      'italian': 'Italian',
      'mexican': 'Mexican',
      'indian': 'Indian',
      'chinese': 'Chinese',
      'japanese': 'Japanese',
      'thai': 'Thai',
      'mediterranean': 'Mediterranean'
    };
    return names[cuisine] || cuisine;
  };

  const formatRecipe = (recipeText) => {
    if (!recipeText) return null;
    
    const text = typeof recipeText === 'string' ? recipeText : String(recipeText);
    
    const lines = text.split('\n');
    return lines.map((line, index) => {
      if (line.includes('**') || line.includes('#')) {
        return <h4 key={index}>{line.replace(/\*\*/g, '').replace(/#/g, '')}</h4>;
      }
      if (line.trim().startsWith('-')) {
        return <li key={index} className="recipe-list-item">{line.substring(1)}</li>;
      }
      if (line.trim().match(/^\d+\./)) {
        return <div key={index} className="recipe-step">{line}</div>;
      }
      if (line.trim() === '') {
        return <br key={index} />;
      }
      return <p key={index} className="recipe-paragraph">{line}</p>;
    });
  };

  return (
    <div className="recipe-generator">
      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner">
              <FiLoader />
            </div>
            <h3>Please be patient</h3>
            <p className="loading-message">
              {getCuisineEmoji(formData.cuisine)} Creating your {getCuisineName(formData.cuisine)} recipe...
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
              <p className="loading-tip">🥗 Calculating perfect ingredient ratios</p>
              <p className="loading-tip">🔪 Preparing step-by-step instructions</p>
              <p className="loading-tip">⏱️ Optimizing cooking times</p>
              {formData.dietaryRestrictions && (
                <p className="loading-tip">✨ Adapting for {formData.dietaryRestrictions} dietary needs</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="header">
        <h2>🍳 AI Recipe Generator</h2>
        {(formData.ingredients || recipe) && (
          <button onClick={clearForm} className="clear-btn">
            Clear
          </button>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="recipe-form">
        <div className="form-group">
          <label>Ingredients (comma-separated) *</label>
          <input
            type="text"
            name="ingredients"
            value={formData.ingredients}
            onChange={handleChange}
            placeholder="e.g., chicken, rice, tomatoes, onions"
            required
            disabled={loading}
            className={error ? 'error' : ''}
          />
          {error && <small className="error-text">{error}</small>}
        </div>

        <div className="form-group">
          <label>Cuisine Type</label>
          <select
            name="cuisine"
            value={formData.cuisine}
            onChange={handleChange}
            disabled={loading}
          >
            <option value="any">🌍 Any Cuisine</option>
            <option value="italian">🍝 Italian</option>
            <option value="mexican">🌮 Mexican</option>
            <option value="indian">🍛 Indian</option>
            <option value="chinese">🥡 Chinese</option>
            <option value="japanese">🍣 Japanese</option>
            <option value="thai">🥘 Thai</option>
            <option value="mediterranean">🫒 Mediterranean</option>
          </select>
        </div>

        <div className="form-group">
          <label>Dietary Restrictions</label>
          <input
            type="text"
            name="dietaryRestrictions"
            value={formData.dietaryRestrictions}
            onChange={handleChange}
            placeholder="e.g., vegetarian, gluten-free, vegan"
            disabled={loading}
          />
        </div>

        <button type="submit" disabled={loading || !formData.ingredients.trim()} className="submit-btn">
          {loading ? (
            <>
              <FiLoader className="spinning" /> Cooking...
            </>
          ) : (
            '👨‍🍳 Generate Recipe'
          )}
        </button>
      </form>

      {saveSuccess && (
        <div className="success-message">
          {saveSuccess}
        </div>
      )}

      {recipe && (
        <div className="recipe-result">
          <div className="recipe-header">
            <h3>✨ Your Custom {getCuisineName(formData.cuisine)} Recipe</h3>
            <button onClick={saveRecipe} className="save-btn">
              💾 Save Recipe
            </button>
          </div>
          <div className="recipe-content">
            {formatRecipe(recipe)}
          </div>
          <div className="recipe-footer">
            <small>Generated with {formData.ingredients}</small>
          </div>
        </div>
      )}

      {savedRecipes.length > 0 && (
        <div className="saved-recipes">
          <h4>📚 Saved Recipes</h4>
          <div className="saved-recipes-list">
            {savedRecipes.map(saved => (
              <div 
                key={saved.id} 
                className="saved-recipe-item"
              >
                <div className="saved-recipe-header">
                  <span className="recipe-date">
                    {new Date(saved.savedAt).toLocaleDateString()}
                  </span>
                  <button 
                    className="delete-btn"
                    onClick={() => deleteSavedRecipe(saved.id)}
                    title="Delete recipe"
                  >
                    ❌
                  </button>
                </div>
                <div 
                  className="recipe-preview"
                  onClick={() => {
                    setRecipe(saved.recipeText);
                    setFormData({
                      ingredients: saved.ingredients,
                      cuisine: saved.cuisine,
                      dietaryRestrictions: saved.dietaryRestrictions
                    });
                  }}
                >
                  <small>{saved.ingredients.substring(0, 30)}...</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .recipe-generator {
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

        .clear-btn {
          padding: 0.5rem 1rem;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.3s ease;
        }

        .clear-btn:hover {
          background: #dc2626;
          transform: translateY(-2px);
        }

        .recipe-form {
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

        input.error {
          border-color: #f56565;
        }

        .error-text {
          color: #f56565;
          font-size: 0.875rem;
          margin-top: 0.25rem;
          display: block;
        }

        input:focus, select:focus {
          outline: none;
          border-color: #b45309;
          box-shadow: 0 0 0 3px rgba(180, 83, 9, 0.1);
        }

        input:disabled, select:disabled {
          background: #f7fafc;
          cursor: not-allowed;
          opacity: 0.7;
        }

        .submit-btn {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(135deg, #b45309, #d97706);
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
          box-shadow: 0 10px 25px rgba(180, 83, 9, 0.3);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
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

        .error-message {
          margin-top: 2rem;
          padding: 1rem;
          background: #fff5f5;
          border: 2px solid #fc8181;
          border-radius: 10px;
          color: #c53030;
        }

        .recipe-result {
          margin-top: 2rem;
          background: white;
          border-radius: 20px;
          padding: 2rem;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
        }

        .recipe-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #e2e8f0;
        }

        .recipe-header h3 {
          color: #2d3748;
          font-size: 1.5rem;
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

        .save-btn:hover:not(:disabled) {
          background: #059669;
          transform: translateY(-2px);
        }

        .save-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .recipe-content {
          line-height: 1.8;
          color: #4a5568;
        }

        .recipe-content h4 {
          color: #b45309;
          margin: 1.5rem 0 0.5rem 0;
          font-size: 1.2rem;
        }

        .recipe-list-item {
          margin-left: 2rem;
          margin-bottom: 0.25rem;
          color: #4a5568;
        }

        .recipe-step {
          background: #fef3c7;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          margin: 0.5rem 0;
          border-left: 4px solid #b45309;
        }

        .recipe-paragraph {
          margin: 1rem 0;
        }

        .recipe-footer {
          margin-top: 2rem;
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
          color: #718096;
          font-style: italic;
        }

        .saved-recipes {
          margin-top: 2rem;
          background: white;
          border-radius: 20px;
          padding: 1.5rem;
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.05);
        }

        .saved-recipes h4 {
          color: #2d3748;
          margin-bottom: 1rem;
          font-size: 1.2rem;
        }

        .saved-recipes-list {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          overflow-y: auto;
        }

        .saved-recipe-item {
          flex: 1;
          min-width: 200px;
          padding: 0.8rem;
          background: #f7fafc;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
        }

        .saved-recipe-item:hover {
          border-color: #b45309;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(180, 83, 9, 0.1);
        }

        .saved-recipe-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          margin-bottom: 0.5rem;
        }

        .recipe-date {
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

        .recipe-preview {
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 4px;
        }

        .recipe-preview:hover {
          background: #f1f5f9;
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
          color: #b45309;
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
          color: #b45309;
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
          background: linear-gradient(90deg, #b45309, #d97706);
          border-radius: 10px;
          animation: progress 3s ease-in-out infinite;
          width: 0%;
        }

        .loading-tips {
          margin-top: 2rem;
          text-align: left;
          background: #fef3c7;
          padding: 1rem;
          border-radius: 15px;
        }

        .loading-tip {
          color: #92400e;
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
          .recipe-generator {
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

          .saved-recipes-list {
            flex-direction: column;
          }

          .saved-recipe-item {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default RecipeGenerator;