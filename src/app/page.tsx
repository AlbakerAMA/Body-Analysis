"use client";

import { useState } from 'react';
import EnhancedImageUploadForm from '../components/ImageUploadForm';
import { User, Utensils, Camera, Edit3, Save, X, RefreshCw, Target } from 'lucide-react';

interface EnhancedAnalysisResult {
  bodyFatPercentage: number;
  confidence: number;
  bodyType: string;
  bodyShape: string;
  healthProblems: string[];
  additionalDetails: string;
  recommendations?: string[];
}

interface UserProfile {
  age: string;
  gender: string;
  height: string;
  weight: string;
  activityLevel: string;
}

interface MealPlanData {
  goal: string;
  restrictions: string;
  preferences: string;
}

interface Meal {
  type: string;
  name: string;
  calories: number;
  protein: string;
  carbs: string;
  fat: string;
}

interface DayPlan {
  day: string;
  meals: Meal[];
  totalCalories: number;
}

export default function Home() {
  // Body Analysis State
  const [result, setResult] = useState<EnhancedAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // UI State
  const [activeTab, setActiveTab] = useState<'body-analysis' | 'meal-planning'>('body-analysis');
  
  // Meal Planning State
  const [userProfile, setUserProfile] = useState<UserProfile>({
    age: '',
    gender: '',
    height: '',
    weight: '',
    activityLevel: ''
  });
  
  const [mealPlanData, setMealPlanData] = useState<MealPlanData>({
    goal: '',
    restrictions: '',
    preferences: ''
  });
  
  const [mealPlan, setMealPlan] = useState<DayPlan[] | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [editingMeal, setEditingMeal] = useState<{ dayIndex: number; mealIndex: number } | null>(null);
  const [customMealRequest, setCustomMealRequest] = useState('');

  // Body Analysis Handlers
  const handleAnalysisComplete = (analysisResult: EnhancedAnalysisResult) => {
    setResult(analysisResult);
    setLoading(false);
  };

  const handleAnalysisStart = () => {
    setLoading(true);
    setError(null);
    setResult(null);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setLoading(false);
  };

  const resetAnalysis = () => {
    setResult(null);
    setError(null);
    setLoading(false);
  };

  // Meal Planning Handlers
  const generateMockMealPlan = (userInfo: UserProfile, goals: MealPlanData): DayPlan[] => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
    
    const sampleMeals = {
      Breakfast: [
        { name: "Oatmeal with Berries", calories: 320, protein: "12g", carbs: "58g", fat: "6g" },
        { name: "Greek Yogurt Parfait", calories: 280, protein: "20g", carbs: "35g", fat: "8g" },
        { name: "Avocado Toast", calories: 350, protein: "12g", carbs: "45g", fat: "16g" }
      ],
      Lunch: [
        { name: "Grilled Chicken Salad", calories: 420, protein: "35g", carbs: "20g", fat: "22g" },
        { name: "Quinoa Bowl", calories: 380, protein: "18g", carbs: "52g", fat: "12g" },
        { name: "Turkey Wrap", calories: 340, protein: "28g", carbs: "35g", fat: "12g" }
      ],
      Dinner: [
        { name: "Salmon with Vegetables", calories: 480, protein: "38g", carbs: "25g", fat: "26g" },
        { name: "Lean Beef Stir-fry", calories: 450, protein: "32g", carbs: "30g", fat: "22g" },
        { name: "Vegetarian Pasta", calories: 420, protein: "16g", carbs: "65g", fat: "14g" }
      ],
      Snack: [
        { name: "Mixed Nuts", calories: 180, protein: "6g", carbs: "8g", fat: "15g" },
        { name: "Apple with Peanut Butter", calories: 190, protein: "8g", carbs: "20g", fat: "12g" },
        { name: "Protein Smoothie", calories: 220, protein: "25g", carbs: "18g", fat: "6g" }
      ]
    };

    return days.map(day => ({
      day,
      meals: mealTypes.map(mealType => ({
        type: mealType,
        ...sampleMeals[mealType as keyof typeof sampleMeals][Math.floor(Math.random() * sampleMeals[mealType as keyof typeof sampleMeals].length)]
      })),
      totalCalories: Math.floor(1800 + Math.random() * 400)
    }));
  };

  const handleGenerateMealPlan = async () => {
    setIsGeneratingPlan(true);
    
    try {
      const response = await fetch('/api/generate-meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userProfile: {
            ...userProfile,
            bodyFatPercentage: result?.bodyFatPercentage || null
          },
          mealPlanData
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate meal plan');
      }

      if (data.mealPlan && data.mealPlan.length > 0) {
        setMealPlan(data.mealPlan);
      } else {
        // Fallback to mock data if API returns empty
        const mockPlan = generateMockMealPlan(userProfile, mealPlanData);
        setMealPlan(mockPlan);
      }
    } catch (error) {
      console.error('Error generating meal plan:', error);
      // Fallback to mock data on error
      const mockPlan = generateMockMealPlan(userProfile, mealPlanData);
      setMealPlan(mockPlan);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleEditMeal = (dayIndex: number, mealIndex: number) => {
    setEditingMeal({ dayIndex, mealIndex });
    if (mealPlan) {
      setCustomMealRequest(`Change ${mealPlan[dayIndex].meals[mealIndex].name} to something different`);
    }
  };

  const handleSaveMealEdit = async () => {
    if (!editingMeal || !customMealRequest.trim() || !mealPlan) return;
    
    try {
      const currentMeal = mealPlan[editingMeal.dayIndex].meals[editingMeal.mealIndex];
      
      const response = await fetch('/api/modify-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentMeal,
          userRequest: customMealRequest.trim(),
          userProfile: {
            ...userProfile,
            bodyFatPercentage: result?.bodyFatPercentage || null
          },
          mealPlanData
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to modify meal');
      }

      if (data.modifiedMeal) {
        const updatedMealPlan = [...mealPlan];
        updatedMealPlan[editingMeal.dayIndex].meals[editingMeal.mealIndex] = data.modifiedMeal;
        setMealPlan(updatedMealPlan);
      } else {
        throw new Error('Invalid response from meal modification API');
      }
    } catch (error) {
      console.error('Error modifying meal:', error);
      
      // Fallback: simple mock modification
      const newMeal: Meal = {
        type: mealPlan[editingMeal.dayIndex].meals[editingMeal.mealIndex].type,
        name: "Custom Modified Meal",
        calories: Math.floor(200 + Math.random() * 400),
        protein: `${Math.floor(10 + Math.random() * 30)}g`,
        carbs: `${Math.floor(20 + Math.random() * 50)}g`,
        fat: `${Math.floor(5 + Math.random() * 25)}g`
      };
      
      const updatedMealPlan = [...mealPlan];
      updatedMealPlan[editingMeal.dayIndex].meals[editingMeal.mealIndex] = newMeal;
      setMealPlan(updatedMealPlan);
    } finally {
      setEditingMeal(null);
      setCustomMealRequest('');
    }
  };

  // Helper Functions
  const getSeverityColor = (problems: string[]) => {
    if (problems.length === 0 || problems.some(p => p.toLowerCase().includes('none'))) {
      return 'text-green-600';
    } else if (problems.length <= 2) {
      return 'text-yellow-600';
    } else {
      return 'text-orange-600';
    }
  };

  const getBodyFatCategory = (percentage: number) => {
    if (percentage < 10) return { category: 'Very Low', color: 'text-blue-600' };
    if (percentage < 15) return { category: 'Athletic', color: 'text-green-600' };
    if (percentage < 20) return { category: 'Fit', color: 'text-green-500' };
    if (percentage < 25) return { category: 'Average', color: 'text-yellow-600' };
    if (percentage < 30) return { category: 'Above Average', color: 'text-orange-500' };
    return { category: 'High', color: 'text-red-500' };
  };

  const TabButton = ({ id, icon: Icon, label, isActive, onClick }: {
    id: string;
    icon: any;
    label: string;
    isActive: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-200 ${
        isActive 
          ? 'bg-blue-600 text-white shadow-lg' 
          : 'bg-white text-gray-600 hover:bg-gray-50 shadow-md'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  const MealCard = ({ meal, dayIndex, mealIndex, onEdit }: {
    meal: Meal;
    dayIndex: number;
    mealIndex: number;
    onEdit: (dayIndex: number, mealIndex: number) => void;
  }) => (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-semibold text-gray-800">{meal.type}</h4>
          <p className="text-lg font-medium text-blue-600">{meal.name}</p>
        </div>
        <button
          onClick={() => onEdit(dayIndex, mealIndex)}
          className="text-gray-400 hover:text-blue-600 transition-colors"
        >
          <Edit3 size={16} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
        <span>🔥 {meal.calories} cal</span>
        <span>🥩 {meal.protein}</span>
        <span>🍞 {meal.carbs}</span>
        <span>🥑 {meal.fat}</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🏋️ Health & Nutrition Hub
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Complete body analysis and personalized meal planning
          </p>
          <p className="text-sm text-gray-500">
            Powered by advanced AI and nutrition science
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center gap-4 mb-8">
          <TabButton
            id="body-analysis"
            icon={User}
            label="Body Analysis"
            isActive={activeTab === 'body-analysis'}
            onClick={() => setActiveTab('body-analysis')}
          />
          <TabButton
            id="meal-planning"
            icon={Utensils}
            label="Meal Planning"
            isActive={activeTab === 'meal-planning'}
            onClick={() => setActiveTab('meal-planning')}
          />
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Body Analysis Tab */}
          {activeTab === 'body-analysis' && (
            <>
              {!result && !loading && (
                <EnhancedImageUploadForm
                  onAnalysisStart={handleAnalysisStart}
                  onAnalysisComplete={handleAnalysisComplete}
                  onError={handleError}
                />
              )}

              {loading && (
                <div className="text-center py-16">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-600 border-t-transparent mx-auto mb-6"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xl font-semibold text-gray-800">Analyzing Your Body Composition</p>
                    <p className="text-sm text-gray-600">Step 1: Processing body fat percentage...</p>
                    <p className="text-sm text-gray-600">Step 2: Advanced AI analysis in progress...</p>
                    <p className="text-xs text-gray-500 mt-4">This comprehensive analysis may take up to 30 seconds</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="text-center py-12">
                  <div className="bg-red-50 border border-red-200 rounded-xl p-8">
                    <div className="text-red-600 text-2xl mb-4">⚠️</div>
                    <div className="text-red-600 text-xl font-semibold mb-2">Analysis Failed</div>
                    <p className="text-red-700 mb-6 max-w-md mx-auto">{error}</p>
                    <button
                      onClick={resetAnalysis}
                      className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}

              {result && (
                <div className="space-y-8">
                  {/* Header */}
                  <div className="text-center">
                    <div className="bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-xl p-6">
                      <h2 className="text-3xl font-bold mb-2">✅ Analysis Complete!</h2>
                      <p className="text-green-100">Your comprehensive body composition report is ready</p>
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Body Fat Percentage */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-blue-600 mb-2">
                          {result.bodyFatPercentage.toFixed(1)}%
                        </div>
                        <div className="text-sm font-medium text-gray-700 mb-1">Body Fat</div>
                        <div className={`text-xs font-semibold ${getBodyFatCategory(result.bodyFatPercentage).color}`}>
                          {getBodyFatCategory(result.bodyFatPercentage).category}
                        </div>
                      </div>
                    </div>

                    {/* Confidence Score */}
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-purple-600 mb-2">
                          {(result.confidence * 100).toFixed(0)}%
                        </div>
                        <div className="text-sm font-medium text-gray-700 mb-1">Confidence</div>
                        <div className="text-xs text-gray-500">Analysis Accuracy</div>
                      </div>
                    </div>

                    {/* Body Type */}
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600 mb-2">
                          {result.bodyType.split(' ')[0]}
                        </div>
                        <div className="text-sm font-medium text-gray-700 mb-1">Body Type</div>
                        <div className="text-xs text-gray-500">{result.bodyType}</div>
                      </div>
                    </div>

                    {/* Body Shape */}
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600 mb-2">
                          {result.bodyShape.split(' ')[0]}
                        </div>
                        <div className="text-sm font-medium text-gray-700 mb-1">Body Shape</div>
                        <div className="text-xs text-gray-500">{result.bodyShape}</div>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Analysis */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Health Assessment */}
                    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        🏥 Health Assessment
                      </h3>
                      
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-800 mb-2">Observed Concerns:</h4>
                        {result.healthProblems && result.healthProblems.length > 0 ? (
                          <ul className="space-y-2">
                            {result.healthProblems.map((problem, index) => (
                              <li key={index} className="flex items-start">
                                <span className={`mr-2 ${getSeverityColor(result.healthProblems)}`}>
                                  {problem.toLowerCase().includes('none') ? '✅' : '⚠️'}
                                </span>
                                <span className="text-gray-700 text-sm">{problem}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-green-600 text-sm flex items-center">
                            <span className="mr-2">✅</span>
                            No significant concerns observed
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Additional Details */}
                    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        📊 Detailed Analysis
                      </h3>
                      
                      <div className="prose prose-sm text-gray-700">
                        <p className="leading-relaxed">{result.additionalDetails}</p>
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  {result.recommendations && result.recommendations.length > 0 && (
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        💡 Personalized Recommendations
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {result.recommendations.map((rec, index) => (
                          <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
                            <div className="flex items-start">
                              <span className="text-indigo-500 mr-3 mt-1 text-lg">💪</span>
                              <span className="text-gray-700 text-sm leading-relaxed">{rec}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
                    <button
                      onClick={resetAnalysis}
                      className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors text-lg font-semibold shadow-md hover:shadow-lg"
                    >
                      📷 Analyze Another Photo
                    </button>
                    
                    <button
                      onClick={() => setActiveTab('meal-planning')}
                      className="bg-green-600 text-white px-8 py-3 rounded-xl hover:bg-green-700 transition-colors text-lg font-semibold shadow-md hover:shadow-lg"
                    >
                      🍽️ Get Meal Plan
                    </button>
                  </div>

                  {/* Disclaimer */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-6">
                    <p className="text-yellow-800 text-sm text-center">
                      <strong>Disclaimer:</strong> This analysis is for informational purposes only and should not replace professional medical advice. 
                      Consult with healthcare professionals for medical concerns or before starting any new fitness program.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Meal Planning Tab */}
          {activeTab === 'meal-planning' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Personalized Meal Planning</h2>

              {!mealPlan ? (
                <div className="grid md:grid-cols-2 gap-8">
                  {/* User Profile Input */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <User size={20} />
                      Personal Information
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                          <input
                            type="number"
                            min="13"
                            max="100"
                            value={userProfile.age}
                            onChange={(e) => setUserProfile(prev => ({ ...prev, age: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="25"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                          <select
                            value={userProfile.gender}
                            onChange={(e) => setUserProfile(prev => ({ ...prev, gender: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Height (cm)</label>
                          <input
                            type="number"
                            value={userProfile.height}
                            onChange={(e) => setUserProfile(prev => ({ ...prev, height: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="175"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
                          <input
                            type="number"
                            value={userProfile.weight}
                            onChange={(e) => setUserProfile(prev => ({ ...prev, weight: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="70"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Activity Level</label>
                        <select
                          value={userProfile.activityLevel}
                          onChange={(e) => setUserProfile(prev => ({ ...prev, activityLevel: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select Activity Level</option>
                          <option value="low">Low (Sedentary)</option>
                          <option value="moderate">Moderate (Light Exercise)</option>
                          <option value="high">High (Regular Exercise)</option>
                          <option value="very-high">Very High (Intense Training)</option>
                        </select>
                      </div>

                      {result && (
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h4 className="font-semibold text-blue-800 mb-2">Body Analysis Data Available</h4>
                          <p className="text-blue-700 text-sm">Body Fat: {result.bodyFatPercentage.toFixed(1)}%</p>
                          <p className="text-blue-700 text-sm">Body Type: {result.bodyType}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Meal Plan Goals */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Target size={20} />
                      Meal Plan Goals
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Primary Goal</label>
                        <select
                          value={mealPlanData.goal}
                          onChange={(e) => setMealPlanData(prev => ({ ...prev, goal: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select your goal</option>
                          <option value="weight-loss">Weight Loss</option>
                          <option value="weight-gain">Weight Gain</option>
                          <option value="muscle-gain">Muscle Gain</option>
                          <option value="maintenance">Weight Maintenance</option>
                          <option value="athletic-performance">Athletic Performance</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Dietary Restrictions</label>
                        <textarea
                          value={mealPlanData.restrictions}
                          onChange={(e) => setMealPlanData(prev => ({ ...prev, restrictions: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24"
                          placeholder="e.g., Vegetarian, Gluten-free, Dairy-free, Nut allergies..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Food Preferences</label>
                        <textarea
                          value={mealPlanData.preferences}
                          onChange={(e) => setMealPlanData(prev => ({ ...prev, preferences: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24"
                          placeholder="e.g., Mediterranean cuisine, High protein, Low carb, Spicy foods..."
                        />
                      </div>

                      <button
                        onClick={handleGenerateMealPlan}
                        disabled={isGeneratingPlan || !mealPlanData.goal || !userProfile.age || !userProfile.gender || !userProfile.height || !userProfile.weight || !userProfile.activityLevel}
                        className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 flex items-center justify-center gap-2"
                      >
                        {isGeneratingPlan ? (
                          <>
                            <RefreshCw size={20} className="animate-spin" />
                            Generating Your Meal Plan...
                          </>
                        ) : (
                          <>
                            <Target size={20} />
                            Generate 7-Day Meal Plan
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Generated Meal Plan Display */
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold">Your Personalized 7-Day Meal Plan</h3>
                    <button
                      onClick={() => setMealPlan(null)}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Generate New Plan
                    </button>
                  </div>

                  <div className="grid gap-6">
                    {mealPlan.map((day, dayIndex) => (
                      <div key={day.day} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-lg font-semibold text-gray-800">{day.day}</h4>
                          <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                            Total: {day.totalCalories} calories
                          </span>
                        </div>
                        
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {day.meals.map((meal, mealIndex) => (
                            <MealCard
                              key={`${dayIndex}-${mealIndex}`}
                              meal={meal}
                              dayIndex={dayIndex}
                              mealIndex={mealIndex}
                              onEdit={handleEditMeal}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Meal Edit Modal */}
              {editingMeal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-lg p-6 w-full max-w-md">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Edit Meal</h3>
                      <button
                        onClick={() => setEditingMeal(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X size={20} />
                      </button>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">
                        Current: {mealPlan && mealPlan[editingMeal.dayIndex].meals[editingMeal.mealIndex].name}
                      </p>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Describe what you'd like instead:
                      </label>
                      <textarea
                        value={customMealRequest}
                        onChange={(e) => setCustomMealRequest(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24"
                        placeholder="e.g., Something with more vegetables, A vegetarian option, Higher protein meal..."
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingMeal(null)}
                        className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveMealEdit}
                        disabled={!customMealRequest.trim()}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
                      >
                        <Save size={16} />
                        Update Meal
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}