import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { styled } from 'nativewind';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { FIREBASE_DB, FIREBASE_AUTH } from '../firebaseConfig';
import { WorkoutLog } from '../services/TrackingService';
import ScreenWrapper from '../components/ScreenWrapper';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledScrollView = styled(ScrollView);

const StyledAnimatedView = styled(Animated.View);

export default function ProgressScreen({ navigation }: any) {
    const [logs, setLogs] = useState<WorkoutLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalWorkouts: 0, totalExercises: 0 });

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        const user = FIREBASE_AUTH.currentUser;
        if (!user) return;

        try {
            const q = query(
                collection(FIREBASE_DB, "workoutLogs"),
                where("userId", "==", user.uid),
                orderBy("date", "desc"),
                limit(10)
            );

            const querySnapshot = await getDocs(q);
            const fetchedLogs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WorkoutLog));
            setLogs(fetchedLogs);

            setStats({
                totalWorkouts: querySnapshot.size,
                totalExercises: fetchedLogs.reduce((acc, log) => acc + log.exercises.length, 0)
            });

        } catch (error) {
            console.error("Error fetching logs:", error);
            Alert.alert('Error', 'Failed to load progress');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <ScreenWrapper className="justify-center items-center">
                <ActivityIndicator size="large" color="#00E676" />
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper>
            <StyledScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
                <StyledAnimatedView entering={FadeInDown.delay(200).duration(800).springify()}>
                    <StyledText className="text-primary text-4xl font-bold mt-6 mb-8 text-center tracking-tight">Your Progress</StyledText>
                </StyledAnimatedView>

                <StyledAnimatedView entering={FadeInDown.delay(400).duration(800).springify()} className="flex-row justify-between mb-8">
                    <StyledView className="bg-surface/80 p-5 rounded-2xl flex-1 mr-2 border border-gray-700 items-center shadow-lg">
                        <StyledText className="text-white text-3xl font-bold">{stats.totalWorkouts}</StyledText>
                        <StyledText className="text-gray-400 text-xs uppercase tracking-wider mt-1">Workouts</StyledText>
                    </StyledView>
                    <StyledView className="bg-surface/80 p-5 rounded-2xl flex-1 ml-2 border border-gray-700 items-center shadow-lg">
                        <StyledText className="text-secondary text-3xl font-bold">{stats.totalExercises}</StyledText>
                        <StyledText className="text-gray-400 text-xs uppercase tracking-wider mt-1">Exercises</StyledText>
                    </StyledView>
                </StyledAnimatedView>

                <StyledAnimatedView entering={FadeInDown.delay(600).duration(800).springify()}>
                    <StyledText className="text-white text-xl font-bold mb-4 ml-1">Recent History</StyledText>
                </StyledAnimatedView>

                {logs.length === 0 ? (
                    <StyledText className="text-gray-400 italic text-center mt-4">No workouts logged yet. Go lift!</StyledText>
                ) : (
                    logs.map((log, index) => (
                        <StyledAnimatedView
                            key={index}
                            entering={FadeInUp.delay(800 + (index * 100)).duration(800).springify()}
                            className="bg-surface/60 p-5 rounded-2xl mb-4 border border-gray-800 shadow-md"
                        >
                            <StyledView className="flex-row justify-between mb-2 items-center">
                                <StyledText className="text-white font-bold text-lg">{log.workoutName}</StyledText>
                                <StyledView className="bg-gray-800 px-2 py-1 rounded-lg">
                                    <StyledText className="text-gray-400 text-xs font-medium">
                                        {new Date(log.date.seconds * 1000).toLocaleDateString()}
                                    </StyledText>
                                </StyledView>
                            </StyledView>
                            <StyledText className="text-gray-500 text-sm">
                                ✅ {log.exercises.length} Exercises Completed
                            </StyledText>
                        </StyledAnimatedView>
                    ))
                )}
            </StyledScrollView>
        </ScreenWrapper>
    );
}
