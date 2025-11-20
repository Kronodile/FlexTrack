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
  }[];
}

export interface WorkoutPlan {
  split_name: string;
  days_per_week: number;
  routine: WorkoutDay[];
}

export const generateWorkoutPlan = async (
  equipment: string,
  split: string,
  days: number
): Promise<WorkoutPlan> => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
    You are an expert fitness coach. Create a highly personalized, detailed workout plan based on the following constraints.

    User Profile:
    - Days per week: ${days}
    - Split preference: ${split}
    - Available Equipment: ${equipment}

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
              "weight_guidance": "string (e.g., '70% 1RM' or 'RPE 8')", 
              "rest": "string (e.g., '90s')",
              "notes": "string (form cues or tempo)" 
            }
          ]
        }
      ]
    }
    3. Ensure the routine is scientifically sound, balanced, and appropriate for the equipment provided.
    4. Include a dynamic warmup for each day.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean up markdown code blocks if present
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(jsonStr) as WorkoutPlan;
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};
