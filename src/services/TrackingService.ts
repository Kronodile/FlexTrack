import { collection, addDoc, query, where, getDocs, doc, updateDoc, deleteDoc, Timestamp, orderBy } from 'firebase/firestore';
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
    const user = FIREBASE_AUTH.currentUser;
    if (!user) throw new Error("User not authenticated");

    try {
        const docRef = await addDoc(collection(FIREBASE_DB, "workoutPlans"), {
            userId: user.uid,
            ...plan,
            createdAt: Timestamp.now(),
        });
        console.log("Plan saved to Firestore with ID: ", docRef.id);
        return docRef.id;
    } catch (e) {
        console.error("Error saving plan to Firestore: ", e);
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

export const getUserPlans = async (): Promise<WorkoutPlan[]> => {
    // Try to get from local storage first for speed
    const localPlans = await LocalStorageService.getWorkoutPlans();
    if (localPlans.length > 0) {
        return localPlans;
    }

    // If no local plans, fetch from Firestore
    return await refreshUserPlans();
};

export const refreshUserPlans = async (): Promise<WorkoutPlan[]> => {
    const user = FIREBASE_AUTH.currentUser;
    if (!user) return [];

    try {
        const q = query(
            collection(FIREBASE_DB, "workoutPlans"),
            where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        const plans = querySnapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
        })) as unknown as WorkoutPlan[];

        // Sort client-side to avoid index requirement
        plans.sort((a, b) => {
            const dateA = a.createdAt?.seconds || 0;
            const dateB = b.createdAt?.seconds || 0;
            return dateB - dateA;
        });

        // Update local storage
        await LocalStorageService.saveWorkoutPlans(plans);
        return plans;
    } catch (e) {
        console.error("Error fetching user plans: ", e);
        return [];
    }
};

export const deleteWorkoutPlan = async (planId: string): Promise<void> => {
    try {
        await deleteDoc(doc(FIREBASE_DB, "workoutPlans", planId));

        // Update local storage
        const currentPlans = await LocalStorageService.getWorkoutPlans();
        const updatedPlans = currentPlans.filter(p => p.id !== planId);
        await LocalStorageService.saveWorkoutPlans(updatedPlans);
    } catch (e) {
        console.error("Error deleting workout plan: ", e);
        throw e;
    }
};

export const updateWorkoutPlan = async (planId: string, updates: Partial<WorkoutPlan>): Promise<void> => {
    try {
        const planRef = doc(FIREBASE_DB, "workoutPlans", planId);
        await updateDoc(planRef, updates);

        // Update local storage
        const currentPlans = await LocalStorageService.getWorkoutPlans();
        const updatedPlans = currentPlans.map(p =>
            p.id === planId ? { ...p, ...updates } : p
        );
        await LocalStorageService.saveWorkoutPlans(updatedPlans);
    } catch (e) {
        console.error("Error updating workout plan: ", e);
        throw e;
    }
};

export const deleteWorkoutLog = async (logId: string): Promise<void> => {
    try {
        await deleteDoc(doc(FIREBASE_DB, "workoutLogs", logId));
    } catch (e) {
        console.error("Error deleting workout log: ", e);
        throw e;
    }
};

