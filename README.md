# Body Analysis Application Setup

## Overview
This application provides comprehensive body analysis including body type, shape, health assessment, and personalized recommendations


### User Input Collection
The application now collects 6 inputs from users:
1. **Age** (13-100 years)
2. **Gender** (Male/Female)
3. **Height** (in centimeters)
4. **Weight** (in kilograms)
5. **Activity Level** (Low, Moderate, High, Very High)
6. **Body Photo** (for visual analysis)



## Setup Instructions

### 1. Environment Variables
Create a `.env.local` file in your project root with the following variables:

```bash
# Nyckel API (for body fat analysis)
NYCKEL_API_KEY=your_nyckel_api_key
# OR use client credentials
NYCKEL_CLIENT_ID=your_client_id
NYCKEL_CLIENT_SECRET=your_client_secret

# MoonshotAI API (for enhanced analysis)
MOONSHOT_API_KEY=your_moonshot_api_key
```

### 2. API Key Setup

#### Nyckel API Setup
1. Visit [Nyckel.com](https://www.nyckel.com)
2. Create an account and set up a body fat percentage function
3. Get your API key or client credentials
4. Add to environment variables

#### MoonshotAI Setup
1. Visit MoonshotAI platform
2. Subscribe to the "Kimi VL A3B Thinking" model
3. Get your API key
4. Add to environment variables

### Two-Step Analysis Process

#### Step 1: Body Fat Analysis 
- Processes the uploaded image
- Returns body fat percentage and confidence score

#### Step 2: Enhanced Analysis (MoonshotAI)
- Receives all user inputs + body fat percentage
- Performs comprehensive visual and data analysis
- Returns detailed insights about body type, shape, health concerns

### Error Handling
- Graceful fallbacks if either API fails
- Development mode with mock data
- User-friendly error messages
- Automatic retry mechanisms

## Usage Flow
1. User fills in personal information (age, gender, height, weight, activity)
2. User uploads body photo
3. System validates all inputs

4. Combined results displayed in enhanced UI

