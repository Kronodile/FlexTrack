import { collection, addDoc, query, where, getDocs, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { FIREBASE_DB, FIREBASE_AUTH } from '../firebaseConfig';
import { WorkoutPlan, WorkoutDay } from './GeminiService';

export interface WorkoutLog {
    id?: string;
    userId: string;
    workoutName: string; // e.g., "Push Day"
    date: Timestamp;
    exercises: {
        name: string;
        sets: {
            reps: number;
            weight: number;
            completed: boolean;
        }[];
    }[];
    durationMinutes?: number;
}

import { LocalStorageService } from './LocalStorageService';

export const saveWorkoutPlan = async (plan: WorkoutPlan) => {
    try {
        // Get existing plans
        const existingPlans = await LocalStorageService.getWorkoutPlans();
        // Add new plan
        const updatedPlans = [...existingPlans, plan];
        // Save back to local storage
        await LocalStorageService.saveWorkoutPlans(updatedPlans);
        console.log("Plan saved locally");
        return "local-id-" + Date.now();
    } catch (e) {
        console.error("Error saving plan locally: ", e);
        throw e;
    }
};

export const logWorkout = async (log: Omit<WorkoutLog, 'id' | 'userId'>) => {
    const user = FIREBASE_AUTH.currentUser;
    if (!user) throw new Error("User not authenticated");

    try {
        await addDoc(collection(FIREBASE_DB, "workoutLogs"), {
            userId: user.uid,
            ...log,
        });
    } catch (e) {
        console.error("Error logging workout: ", e);
        throw e;
    }
};

export const getUserPlans = async () => {
    return await LocalStorageService.getWorkoutPlans();
};
