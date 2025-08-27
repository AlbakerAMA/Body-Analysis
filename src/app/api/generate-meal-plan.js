

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { userProfile, mealPlanData } = req.body;

    // Validate required fields
    if (!userProfile || !mealPlanData) {
      return res.status(400).json({ 
        error: 'Missing required data. Please provide userProfile and mealPlanData.' 
      });
    }

    // Validate user profile fields
    const { age, gender, height, weight, activityLevel, bodyFatPercentage } = userProfile;
    if (!age || !gender || !height || !weight || !activityLevel) {
      return res.status(400).json({ 
        error: 'Missing required user profile data. Please provide age, gender, height, weight, and activityLevel.' 
      });
    }

    // Validate meal plan data
    const { goal, restrictions, preferences } = mealPlanData;
    if (!goal) {
      return res.status(400).json({ 
        error: 'Missing goal. Please specify your primary goal.' 
      });
    }

    // Calculate BMI and daily calorie needs
    const heightInMeters = parseInt(height) / 100;
    const weightInKg = parseInt(weight);
    const bmi = (weightInKg / (heightInMeters * heightInMeters)).toFixed(1);
    
    // Calculate BMR (Basal Metabolic Rate) using Mifflin-St Jeor Equation
    let bmr;
    if (gender.toLowerCase() === 'male') {
      bmr = (10 * weightInKg) + (6.25 * parseInt(height)) - (5 * parseInt(age)) + 5;
    } else {
      bmr = (10 * weightInKg) + (6.25 * parseInt(height)) - (5 * parseInt(age)) - 161;
    }

    // Apply activity level multiplier
    const activityMultipliers = {
      'low': 1.2,
      'moderate': 1.375,
      'high': 1.55,
      'very-high': 1.725
    };
    
    const tdee = bmr * (activityMultipliers[activityLevel] || 1.2);
    
    // Adjust calories based on goal
    let targetCalories;
    switch (goal) {
      case 'weight-loss':
        targetCalories = Math.round(tdee - 500); // 500 calorie deficit
        break;
      case 'weight-gain':
        targetCalories = Math.round(tdee + 500); // 500 calorie surplus
        break;
      case 'muscle-gain':
        targetCalories = Math.round(tdee + 300); // 300 calorie surplus
        break;
      case 'athletic-performance':
        targetCalories = Math.round(tdee + 200); // Slight surplus for performance
        break;
      default:
        targetCalories = Math.round(tdee); // Maintenance
    }

    // Ensure minimum calories for health
    targetCalories = Math.max(targetCalories, gender.toLowerCase() === 'male' ? 1500 : 1200);

    // Create detailed prompt for OpenRouter API
    const prompt = `
You are a professional nutritionist and meal planning expert. Create a comprehensive 7-day meal plan based on the following client information:

**Client Profile:**
- Age: ${age} years
- Gender: ${gender}
- Height: ${height}cm
- Weight: ${weight}kg
- Activity Level: ${activityLevel}
- BMI: ${bmi}
- ${bodyFatPercentage ? `Body Fat Percentage: ${bodyFatPercentage}%` : ''}
- Target Daily Calories: ${targetCalories}

**Goals & Preferences:**
- Primary Goal: ${goal}
- Dietary Restrictions: ${restrictions || 'None specified'}
- Food Preferences: ${preferences || 'None specified'}

**Requirements:**
1. Create a 7-day meal plan (Monday through Sunday)
2. Each day should include: Breakfast, Lunch, Dinner, and 1-2 Snacks
3. Meet the target calorie goal (±50 calories per day)
4. Ensure balanced macronutrients appropriate for the goal:
   - Weight Loss: Higher protein (30%), moderate carbs (35%), moderate fat (35%)
   - Weight Gain: Balanced macros (25% protein, 45% carbs, 30% fat)
   - Muscle Gain: High protein (35%), moderate carbs (40%), moderate fat (25%)
   - Maintenance: Balanced (25% protein, 45% carbs, 30% fat)
   - Athletic Performance: Higher carbs (30% protein, 50% carbs, 20% fat)
5. Respect all dietary restrictions and preferences
6. Include variety and nutritionally dense foods
7. Provide practical, realistic meals that are achievable

**Output Format:**
Return a JSON object with the following structure:
{
  "mealPlan": [
    {
      "day": "Monday",
      "totalCalories": 1850,
      "meals": [
        {
          "type": "breakfast",
          "name": "Greek Yogurt Parfait with Berries",
          "calories": 320,
          "protein": "25g",
          "carbs": "35g",
          "fat": "8g",
          "ingredients": ["1 cup Greek yogurt", "1/2 cup mixed berries", "2 tbsp granola", "1 tsp honey"],
          "instructions": "Layer yogurt, berries, and granola. Drizzle with honey."
        }
      ]
    }
  ],
  "weeklyTotals": {
    "avgDailyCalories": 1845,
    "avgProtein": "128g",
    "avgCarbs": "185g",
    "avgFat": "65g"
  },
  "nutritionalGoals": {
    "targetCalories": ${targetCalories},
    "proteinPercent": "25%",
    "carbsPercent": "45%",
    "fatPercent": "30%"
  },
  "notes": "Additional tips or recommendations"
}

Ensure all meals are realistic, delicious, and aligned with the client's goals and restrictions.`;

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
        model: 'openai/gpt-oss-20b:free', // You can change this to other models
        messages: [
          {
            role: 'system',
            content: 'You are a professional nutritionist and meal planning expert. Always respond with valid JSON format as requested.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    if (!openRouterResponse.ok) {
      const errorData = await openRouterResponse.text();
      console.error('OpenRouter API Error:', errorData);
      return res.status(500).json({ 
        error: 'Failed to generate meal plan. Please try again.',
        details: process.env.NODE_ENV === 'development' ? errorData : undefined
      });
    }

    const aiResponse = await openRouterResponse.json();
    
    if (!aiResponse.choices || !aiResponse.choices[0] || !aiResponse.choices[0].message) {
      return res.status(500).json({ 
        error: 'Invalid response from AI service. Please try again.' 
      });
    }

    let mealPlanResponse;
    try {
      // Extract JSON from the AI response
      const content = aiResponse.choices[0].message.content;
      
      // Try to parse JSON, handling potential formatting issues
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        mealPlanResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in response');
      }
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      
      // Fallback: create a basic meal plan structure
      mealPlanResponse = {
        error: 'Could not parse AI response',
        mealPlan: [],
        message: 'Please try again with different parameters.'
      };
    }

    // Add metadata to the response
    mealPlanResponse.metadata = {
      generatedAt: new Date().toISOString(),
      userProfile: {
        bmi: parseFloat(bmi),
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        targetCalories
      },
      requestId: `meal_${Date.now()}`
    };

    return res.status(200).json(mealPlanResponse);

  } catch (error) {
    console.error('Meal Plan Generation Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error while generating meal plan.',
      message: 'Please try again later.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}