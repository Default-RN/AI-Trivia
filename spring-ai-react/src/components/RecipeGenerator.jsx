import React, { useState } from 'react';
import axios from 'axios';

const RecipeGenerator = () => {
const [formData, setFormData] = useState({
    ingredients: '',
    cuisine: 'any',
    dietaryRestrictions: ''
});
const [recipe, setRecipe] = useState('');
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
    setRecipe('');

    try {
    const response = await axios.get('http://localhost:8080/recipe-creator', {
        params: {
        ingredients: formData.ingredients,
        cuisine: formData.cuisine,
        dietaryRestrictions: formData.dietaryRestrictions
        }
    });
    setRecipe(response.data);
    } catch (err) {
        setError('Failed to generate recipe. Please try again.');
        console.error('Error:', err);
    } finally {
        setLoading(false);
    }
};

return (
    <div className="recipe-generator">
    <h2>🍳 AI Recipe Generator</h2>
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
        />
        </div>

        <div className="form-group">
        <label>Cuisine Type</label>
        <select name="cuisine" value={formData.cuisine} onChange={handleChange}>
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
        />
        </div>

        <button type="submit" disabled={loading} className="submit-btn">
        {loading ? 'Cooking...' : '👨‍🍳 Generate Recipe'}
        </button>
    </form>

    {error && <div className="error-message">{error}</div>}

    {recipe && (
        <div className="recipe-result">
        <h3>Your Custom Recipe</h3>
        <div className="recipe-content">
            {recipe.split('\n').map((line, index) => {
            if (line.includes('**') || line.includes('#')) {
                return <h4 key={index}>{line.replace(/\*\*/g, '').replace(/#/g, '')}</h4>;
            }
            if (line.trim().startsWith('-')) {
                return <li key={index}>{line}</li>;
            }
            return <p key={index}>{line}</p>;
            })}
        </div>
        </div>
    )}
    </div>
);
};

export default RecipeGenerator;