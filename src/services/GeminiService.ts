import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";

const genAI = new GoogleGenerativeAI(API_KEY);

export interface WorkoutDay {
  day: string;
  focus: string;
  warmup: string;
  exercises: {
    name: string;
    sets: string;
    reps: string;
    weight_guidance: string;
    rest: string;
    notes?: string;
    last_logged_data?: Array<{ reps: number; weight: number; completed: boolean }>;
  }[];
}

export interface WorkoutPlan {
  id?: string;
  userId?: string;
  createdAt?: any;
  split_name: string;
  days_per_week: number;
  routine: WorkoutDay[];
}

export const generateWorkoutPlan = async (
  equipment: string,
  split: string,
  days: number,
  level: string,
  weight: string,
  age: string,
  gender: string,
  comments?: string
): Promise<WorkoutPlan> => {
  // Connectivity Check
  try {
    const check = await fetch('https://www.google.com', { method: 'HEAD' });
    console.log('Connectivity Check:', check.status);
  } catch (netError) {
    console.error('Connectivity Check Failed:', netError);
    throw new Error('No Internet Connection. Please check your device settings.');
  }

  const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

  const prompt = `
    You are an expert fitness coach. Create a highly personalized, detailed workout plan based on the following constraints.

    User Profile:
    - Days per week: ${days}
    - Split preference: ${split}
    - Experience Level: ${level}
    - Body Weight: ${weight}
    - Age: ${age}
    - Gender: ${gender}
    - Available Equipment: ${equipment}
    - Additional Notes/Goals: ${comments || 'None'}

    Strict Output Requirements:
    1. Return ONLY valid JSON. No markdown formatting, no introductory text.
    2. The JSON must match this structure exactly:
    {
      "split_name": "string (e.g., 'Upper/Lower Split')",
      "days_per_week": number,
      "routine": [
        {
          "day": "string (e.g., 'Day 1')",
          "focus": "string (e.g., 'Upper Body Strength')",
          "warmup": "string (brief warmup instructions)",
          "exercises": [
            { 
              "name": "string (Exercise Name)", 
              "sets": "string (e.g., '3')", 
              "reps": "string (e.g., '8-12')", 
              "weight_guidance": "string (e.g., 'Start with 20 lbs / 9 kg dumbbells' or 'Bodyweight')", 
              "rest": "string (e.g., '90s')",
              "notes": "string (form cues or tempo)" 
            }
          ]
        }
      ]
    }
    3. Ensure the routine is scientifically sound, balanced, and appropriate for the equipment provided.
    4. Include a dynamic warmup for each day.
    5. VERY IMPORTANT: Use the user's Age, Gender, Body Weight, and Experience Level to suggest concrete starting weights (e.g., in lbs or kg) in the "weight_guidance" field. Avoid vague RPEs unless necessary.
  `;

  let retries = 3;
  while (retries > 0) {
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Clean up markdown code blocks if present
      const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();

      return JSON.parse(jsonStr) as WorkoutPlan;
    } catch (error) {
      console.error(`Gemini Generation Error (retries left: ${retries - 1}):`, error);
      retries--;
      if (retries === 0) throw error;
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw new Error("Failed to generate workout plan after multiple attempts.");
};

export const refineWorkoutPlan = async (currentPlan: WorkoutPlan, instructions: string): Promise<WorkoutPlan> => {
  const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });
  const prompt = `
        I have an existing workout plan that I want to refine.
        
        Current Plan:
        ${JSON.stringify(currentPlan, null, 2)}
        
        Refinement Instructions:
        ${instructions}
        
        Please modify the plan according to the instructions. Keep the same JSON structure as the original plan.
        Return ONLY the raw JSON object, no markdown formatting or explanations.
        `;

    let retries = 3;
    while (retries > 0) {
      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean up markdown code blocks if present
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const plan = JSON.parse(jsonStr);
        return plan;
      } catch (error) {
        console.error(`Error refining workout plan (retries left: ${retries - 1}):`, error);
        retries--;
        if (retries === 0) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    throw new Error("Failed to refine workout plan after multiple attempts.");
};

export const generateProgressSummary = async (logsJson: string): Promise<string> => {
  const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });
  const prompt = `
You are an expert fitness coach analysing a user's recent workout history. 
Here is the user's recent workout log data in JSON format:

${logsJson}

Write a short, motivating, and INSIGHTFUL progress summary (max 4 sentences). Include:
- Overall consistency / frequency observation
- Volume trend (going up, flat, or needs more data)
- A specific, actionable tip based on the data
- An encouraging closing line

Tone: direct, concise, coach-like. Do NOT use markdown or bullet points. Plain text only.
  `;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Error generating progress summary:', error);
    return 'Keep showing up — consistency is the foundation of every great physique. Log more sessions to unlock a full AI analysis.';
  }
};

