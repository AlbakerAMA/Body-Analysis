"use client";

import { useState } from 'react';

interface UserInputs {
  age: number;
  gender: 'male' | 'female';
  height: number;
  weight: number;
  activity: 'low' | 'moderate' | 'high' | 'very_high';
  image: File;
}

interface EnhancedAnalysisResult {
  bodyFatPercentage: number;
  confidence: number;
  bodyType: string;
  bodyShape: string;
  healthProblems: string[];
  additionalDetails: string;
  recommendations?: string[];
}

interface Props {
  onAnalysisStart: () => void;
  onAnalysisComplete: (result: EnhancedAnalysisResult) => void;
  onError: (error: string) => void;
}

export default function EnhancedImageUploadForm({ onAnalysisStart, onAnalysisComplete, onError }: Props) {
  const [formData, setFormData] = useState<Partial<UserInputs>>({
    age: undefined,
    gender: undefined,
    height: undefined,
    weight: undefined,
    activity: undefined,
  });
  const [dragActive, setDragActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleInputChange = (field: keyof UserInputs, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageSelect = (file: File) => {
    setSelectedImage(file);
    setFormData(prev => ({ ...prev, image: file }));
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        handleImageSelect(file);
      } else {
        onError('Please select a valid image file');
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        handleImageSelect(file);
      } else {
        onError('Please select a valid image file');
      }
    }
  };

  const isFormValid = () => {
    return formData.age && 
           formData.gender && 
           formData.height && 
           formData.weight && 
           formData.activity && 
           selectedImage;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      onError('Please fill in all fields and select an image');
      return;
    }

    onAnalysisStart();

    try {
      const submitFormData = new FormData();
      submitFormData.append('image', selectedImage!);
      submitFormData.append('age', formData.age!.toString());
      submitFormData.append('gender', formData.gender!);
      submitFormData.append('height', formData.height!.toString());
      submitFormData.append('weight', formData.weight!.toString());
      submitFormData.append('activity', formData.activity!);

      const response = await fetch('/api/analyze-enhanced', {
        method: 'POST',
        body: submitFormData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const result = await response.json();
      onAnalysisComplete(result);
    } catch (error) {
      console.error('Analysis error:', error);
      onError(error instanceof Error ? error.message : 'Analysis failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Information Section */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Age */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Age (years)
            </label>
            <input
              type="number"
              min="13"
              max="100"
              value={formData.age || ''}
              onChange={(e) => handleInputChange('age', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your age"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gender
            </label>
            <select
              value={formData.gender || ''}
              onChange={(e) => handleInputChange('gender', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          {/* Height */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Height (cm)
            </label>
            <input
              type="number"
              min="100"
              max="250"
              value={formData.height || ''}
              onChange={(e) => handleInputChange('height', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your height in cm"
            />
          </div>

          {/* Weight */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weight (kg)
            </label>
            <input
              type="number"
              min="30"
              max="300"
              step="0.1"
              value={formData.weight || ''}
              onChange={(e) => handleInputChange('weight', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your weight in kg"
            />
          </div>
        </div>

        {/* Activity Level */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Activity Level
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { value: 'low', label: 'Low', description: 'Sedentary lifestyle' },
              { value: 'moderate', label: 'Moderate', description: 'Light exercise 1-3 days/week' },
              { value: 'high', label: 'High', description: 'Moderate exercise 3-5 days/week' },
              { value: 'very_high', label: 'Very High', description: 'Heavy exercise 6-7 days/week' }
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleInputChange('activity', option.value)}
                className={`p-3 text-center border rounded-lg transition-colors ${
                  formData.activity === option.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="font-medium text-sm">{option.label}</div>
                <div className="text-xs text-gray-500 mt-1">{option.description}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Image Upload Section */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Body Photo</h3>
        
        {!selectedImage ? (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="text-6xl mb-4">📷</div>
            <p className="text-lg text-gray-600 mb-2">
              Drag and drop your body photo here
            </p>
            <p className="text-sm text-gray-500 mb-4">
              or click to browse files
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer inline-block"
            >
              Choose Photo
            </label>
            <p className="text-xs text-gray-400 mt-3">
              Supported formats: JPG, PNG, WEBP (Max 10MB)
            </p>
          </div>
        ) : (
          <div className="text-center">
            <div className="relative inline-block">
              <img
                src={imagePreview!}
                alt="Selected body photo"
                className="max-w-xs max-h-64 rounded-lg shadow-md"
              />
              <button
                type="button"
                onClick={() => {
                  setSelectedImage(null);
                  setImagePreview(null);
                  setFormData(prev => ({ ...prev, image: undefined }));
                }}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                ×
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">{selectedImage.name}</p>
            <p className="text-xs text-gray-500">
              {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        )}
      </div>

      {/* Tips Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2">📸 Photo Tips for Best Results</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Stand in good lighting with a plain background</li>
          <li>• Wear form-fitting clothes or minimal clothing</li>
          <li>• Take a front-facing photo with your full body visible</li>
          <li>• Stand naturally with arms slightly away from your body</li>
          <li>• Ensure the photo is clear and not blurry</li>
        </ul>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!isFormValid()}
        className={`w-full py-4 rounded-lg text-lg font-semibold transition-colors ${
          isFormValid()
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {isFormValid() ? '🔬 Analyze My Body Composition' : '📝 Please Complete All Fields'}
      </button>
    </form>
  );
}