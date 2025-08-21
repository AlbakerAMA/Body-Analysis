"use client";

import { useState } from 'react';
import EnhancedImageUploadForm from '../components/ImageUploadForm';

interface EnhancedAnalysisResult {
  bodyFatPercentage: number;
  confidence: number;
  bodyType: string;
  bodyShape: string;
  healthProblems: string[];
  additionalDetails: string;
  recommendations?: string[];
}

export default function Home() {
  const [result, setResult] = useState<EnhancedAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🏋️ Advanced Body Analysis
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            AI-powered comprehensive body composition and health analysis
          </p>
          <p className="text-sm text-gray-500">
            Powered by advanced computer vision and health analytics
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
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
                  onClick={() => window.print()}
                  className="bg-gray-600 text-white px-8 py-3 rounded-xl hover:bg-gray-700 transition-colors text-lg font-semibold shadow-md hover:shadow-lg"
                >
                  🖨️ Print Report
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
        </div>
      </div>
    </div>
  );
}