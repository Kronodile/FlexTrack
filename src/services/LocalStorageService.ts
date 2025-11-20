import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutPlan } from './GeminiService';

const PLANS_KEY = '@flextrack_workout_plans';

export const LocalStorageService = {
    /**
     * Save workout plans to local storage
     */
    saveWorkoutPlans: async (plans: WorkoutPlan[]): Promise<void> => {
        try {
            const jsonValue = JSON.stringify(plans);
            await AsyncStorage.setItem(PLANS_KEY, jsonValue);
        } catch (e) {
            console.error('Error saving workout plans to local storage:', e);
            throw e;
        }
    },

    /**
     * Retrieve workout plans from local storage
     */
    getWorkoutPlans: async (): Promise<WorkoutPlan[]> => {
        try {
            const jsonValue = await AsyncStorage.getItem(PLANS_KEY);
            return jsonValue != null ? JSON.parse(jsonValue) : [];
        } catch (e) {
            console.error('Error reading workout plans from local storage:', e);
            return [];
        }
    },

    /**
     * Clear workout plans from local storage
     */
    clearWorkoutPlans: async (): Promise<void> => {
        try {
            await AsyncStorage.removeItem(PLANS_KEY);
        } catch (e) {
            console.error('Error clearing workout plans from local storage:', e);
            throw e;
        }
    }
};
