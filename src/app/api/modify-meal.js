

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { currentMeal, userRequest, userProfile, mealPlanData } = req.body;

    // Validate required fields
    if (!currentMeal || !userRequest || !userProfile) {
      return res.status(400).json({ 
        error: 'Missing required data. Please provide currentMeal, userRequest, and userProfile.' 
      });
    }

    // Validate current meal structure
    if (!currentMeal.name || !currentMeal.type || !currentMeal.calories) {
      return res.status(400).json({ 
        error: 'Invalid meal data. Missing name, type, or calories.' 
      });
    }

    // Validate user request
    if (typeof userRequest !== 'string' || userRequest.trim().length < 5) {
      return res.status(400).json({ 
        error: 'Please provide a more detailed description of what you want to change.' 
      });
    }

    const { age, gender, height, weight, activityLevel, bodyFatPercentage } = userProfile;
    const { goal, restrictions, preferences } = mealPlanData || {};

    // Calculate target calorie range for the meal type
    const getMealCalorieRange = (mealType, totalDailyCalories) => {
      const ranges = {
        breakfast: { min: 0.20, max: 0.30 }, // 20-30% of daily calories
        lunch: { min: 0.25, max: 0.35 },     // 25-35% of daily calories
        dinner: { min: 0.25, max: 0.35 },    // 25-35% of daily calories
        snack: { min: 0.05, max: 0.15 }      // 5-15% of daily calories
      };
      
      const range = ranges[mealType.toLowerCase()] || ranges.snack;
      return {
        min: Math.round(totalDailyCalories * range.min),
        max: Math.round(totalDailyCalories * range.max)
      };
    };

    // Estimate daily calorie target (simplified version)
    const estimateDailyCalories = () => {
      const heightInMeters = parseInt(height) / 100;
      const weightInKg = parseInt(weight);
      
      let bmr;
      if (gender.toLowerCase() === 'male') {
        bmr = (10 * weightInKg) + (6.25 * parseInt(height)) - (5 * parseInt(age)) + 5;
      } else {
        bmr = (10 * weightInKg) + (6.25 * parseInt(height)) - (5 * parseInt(age)) - 161;
      }

      const activityMultipliers = {
        'low': 1.2,
        'moderate': 1.375,
        'high': 1.55,
        'very-high': 1.725
      };
      
      const tdee = bmr * (activityMultipliers[activityLevel] || 1.2);
      
      switch (goal) {
        case 'weight-loss': return Math.max(Math.round(tdee - 500), gender.toLowerCase() === 'male' ? 1500 : 1200);
        case 'weight-gain': return Math.round(tdee + 500);
        case 'muscle-gain': return Math.round(tdee + 300);
        case 'athletic-performance': return Math.round(tdee + 200);
        default: return Math.round(tdee);
      }
    };

    const dailyCalories = estimateDailyCalories();
    const calorieRange = getMealCalorieRange(currentMeal.type, dailyCalories);

    // Create detailed prompt for meal modification
    const prompt = `
You are a professional nutritionist helping to modify a meal based on a client's request. 

**Current Meal:**
- Type: ${currentMeal.type}
- Name: ${currentMeal.name}
- Calories: ${currentMeal.calories}
- Protein: ${currentMeal.protein}
- Carbs: ${currentMeal.carbs}
- Fat: ${currentMeal.fat}

**Client Request:**
"${userRequest.trim()}"

**Client Profile:**
- Age: ${age} years
- Gender: ${gender}
- Height: ${height}cm
- Weight: ${weight}kg
- Activity Level: ${activityLevel}
- ${bodyFatPercentage ? `Body Fat Percentage: ${bodyFatPercentage}%` : ''}
- Goal: ${goal || 'Not specified'}
- Dietary Restrictions: ${restrictions || 'None'}
- Food Preferences: ${preferences || 'None'}

**Requirements:**
1. Create a new meal that addresses the client's request
2. Keep the meal type the same (${currentMeal.type})
3. Target calorie range: ${calorieRange.min} - ${calorieRange.max} calories
4. Maintain appropriate macronutrient balance for their goal
5. Respect all dietary restrictions and preferences
6. Ensure the meal is practical and realistic to prepare
7. If the request is unclear or impossible, suggest the closest alternative

**Macronutrient Guidelines by Goal:**
- Weight Loss: Higher protein (30%), moderate carbs (35%), moderate fat (35%)
- Weight Gain: Balanced (25% protein, 45% carbs, 30% fat)
- Muscle Gain: High protein (35%), moderate carbs (40%), moderate fat (25%)
- Maintenance: Balanced (25% protein, 45% carbs, 30% fat)
- Athletic Performance: Higher carbs (30% protein, 50% carbs, 20% fat)

**Output Format:**
Return a JSON object with this exact structure:
{
  "modifiedMeal": {
    "type": "${currentMeal.type}",
    "name": "New Meal Name",
    "calories": 400,
    "protein": "25g",
    "carbs": "35g",
    "fat": "15g",
    "ingredients": ["ingredient 1", "ingredient 2", "ingredient 3"],
    "instructions": "Step-by-step preparation instructions"
  },
  "changes": {
    "calorieChange": -50,
    "summary": "Brief explanation of what was changed and why"
  },
  "nutritionalImpact": "Brief note about how this change affects their daily nutrition goals"
}

Provide a meal that closely matches their request while maintaining nutritional appropriateness.`;

    // Make request to OpenRouter API
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Body Analysis & Meal Planning App',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet', // You can change this to other models
        messages: [
          {
            role: 'system',
            content: 'You are a professional nutritionist expert in meal modification and dietary planning. Always respond with valid JSON format as requested.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8, // Slightly higher for more creative meal suggestions
        max_tokens: 1500
      })
    });

    if (!openRouterResponse.ok) {
      const errorData = await openRouterResponse.text();
      console.error('OpenRouter API Error:', errorData);
      return res.status(500).json({ 
        error: 'Failed to modify meal. Please try again.',
        details: process.env.NODE_ENV === 'development' ? errorData : undefined
      });
    }

    const aiResponse = await openRouterResponse.json();
    
    if (!aiResponse.choices || !aiResponse.choices[0] || !aiResponse.choices[0].message) {
      return res.status(500).json({ 
        error: 'Invalid response from AI service. Please try again.' 
      });
    }

    let modificationResponse;
    try {
      // Extract JSON from the AI response
      const content = aiResponse.choices[0].message.content;
      
      // Try to parse JSON, handling potential formatting issues
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        modificationResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in response');
      }

      // Validate the response structure
      if (!modificationResponse.modifiedMeal || !modificationResponse.modifiedMeal.name) {
        throw new Error('Invalid meal modification response structure');
      }

    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      
      // Fallback: create a simple modified meal
      modificationResponse = {
        modifiedMeal: {
          type: currentMeal.type,
          name: `Modified ${currentMeal.name}`,
          calories: currentMeal.calories,
          protein: currentMeal.protein,
          carbs: currentMeal.carbs,
          fat: currentMeal.fat,
          ingredients: ["Modified meal ingredients"],
          instructions: "Please try your request again for detailed instructions."
        },
        changes: {
          calorieChange: 0,
          summary: "Unable to process modification request. Please try again with different wording."
        },
        nutritionalImpact: "No changes were made."
      };
    }

    // Add metadata to the response
    modificationResponse.metadata = {
      modifiedAt: new Date().toISOString(),
      originalMeal: currentMeal,
      userRequest: userRequest.trim(),
      requestId: `modify_${Date.now()}`
    };

    return res.status(200).json(modificationResponse);

  } catch (error) {
    console.error('Meal Modification Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error while modifying meal.',
      message: 'Please try again later.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}