'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface AnalysisResult {
  analysisId: string
  bodyFat: number
  bmi: number
  bmr: number
  measurements: {
    waist: number
    hip: number
    chest: number
    neck: number
  }
  timestamp: string
}

export default function ResultsPage() {
  const params = useParams()
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch(`/api/results/${params.id}`)
        if (response.ok) {
          const data = await response.json()
          setResult(data)
        }
      } catch (error) {
        console.error('Error fetching results:', error)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchResults()
    }
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Analyzing your body composition...</p>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Results Not Found</h2>
          <p className="text-gray-600">The analysis results could not be loaded.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Body Analysis Results</h1>
          <p className="text-gray-600">Comprehensive body composition analysis</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Body Fat %</h3>
            <p className="text-3xl font-bold text-blue-600">{result.bodyFat}%</p>
            <p className="text-sm text-gray-500 mt-1">
              {result.bodyFat < 15 ? 'Athletic' : result.bodyFat < 20 ? 'Fit' : result.bodyFat < 25 ? 'Average' : 'Above Average'}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">BMI</h3>
            <p className="text-3xl font-bold text-green-600">{result.bmi}</p>
            <p className="text-sm text-gray-500 mt-1">
              {result.bmi < 18.5 ? 'Underweight' : result.bmi < 25 ? 'Normal' : result.bmi < 30 ? 'Overweight' : 'Obese'}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">BMR</h3>
            <p className="text-3xl font-bold text-purple-600">{result.bmr}</p>
            <p className="text-sm text-gray-500 mt-1">kcal/day</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Measurements</h3>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Waist:</span> {result.measurements.waist} cm</p>
              <p><span className="font-medium">Hip:</span> {result.measurements.hip} cm</p>
              <p><span className="font-medium">Chest:</span> {result.measurements.chest} cm</p>
              <p><span className="font-medium">Neck:</span> {result.measurements.neck} cm</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">3D Body Avatar</h2>
          <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="w-32 h-48 bg-gray-300 rounded-lg mx-auto mb-4"></div>
              <p className="text-gray-500">3D avatar visualization coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}