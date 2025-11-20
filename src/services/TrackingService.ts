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

export const saveWorkoutPlan = async (plan: WorkoutPlan) => {
    const user = FIREBASE_AUTH.currentUser;
    if (!user) throw new Error("User not authenticated");

    try {
        const docRef = await addDoc(collection(FIREBASE_DB, "workoutPlans"), {
            userId: user.uid,
            ...plan,
            createdAt: Timestamp.now(),
        });
        console.log("Plan saved with ID: ", docRef.id);
        return docRef.id;
    } catch (e) {
        console.error("Error adding document: ", e);
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
    const user = FIREBASE_AUTH.currentUser;
    if (!user) return [];

    const q = query(collection(FIREBASE_DB, "workoutPlans"), where("userId", "==", user.uid));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
