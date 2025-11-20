import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput } from 'react-native';
import { styled } from 'nativewind';
import { getUserPlans, logWorkout, WorkoutLog } from '../services/TrackingService';
import { WorkoutPlan, WorkoutDay } from '../services/GeminiService';
import { Timestamp } from 'firebase/firestore';
import ScreenWrapper from '../components/ScreenWrapper';
import Animated, { FadeInDown, FadeInRight, Layout } from 'react-native-reanimated';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledButton = styled(TouchableOpacity);
const StyledInput = styled(TextInput);
const StyledScrollView = styled(ScrollView);

const StyledAnimatedView = styled(Animated.View);

export default function WorkoutLoggingScreen({ navigation }: any) {
    const [plans, setPlans] = useState<WorkoutPlan[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<WorkoutPlan | null>(null);
    const [selectedDay, setSelectedDay] = useState<WorkoutDay | null>(null);
    const [loading, setLoading] = useState(true);
    const [logData, setLogData] = useState<any>({});

    useEffect(() => {
        loadPlans();
    }, []);

    const loadPlans = async () => {
        try {
            const userPlans = await getUserPlans();
            setPlans(userPlans as unknown as WorkoutPlan[]);
        } catch (error) {
            Alert.alert('Error', 'Failed to load workout plans');
        } finally {
            setLoading(false);
        }
    };

    const handleLogChange = (exerciseIndex: number, setIndex: number, field: 'weight' | 'reps', value: string) => {
        setLogData((prev: any) => {
            const newData = { ...prev };
            if (!newData[exerciseIndex]) newData[exerciseIndex] = {};
            if (!newData[exerciseIndex][setIndex]) newData[exerciseIndex][setIndex] = {};
            newData[exerciseIndex][setIndex][field] = value;
            return newData;
        });
    };

    const finishWorkout = async () => {
        if (!selectedDay || !selectedPlan) return;

        setLoading(true);
        try {
            const exercises = selectedDay.exercises.map((ex, exIdx) => ({
                name: ex.name,
                sets: Array.from({ length: parseInt(ex.sets) }).map((_, setIdx) => ({
                    reps: parseInt(logData[exIdx]?.[setIdx]?.reps || '0'),
                    weight: parseFloat(logData[exIdx]?.[setIdx]?.weight || '0'),
                    completed: true
                }))
            }));

            const log: Omit<WorkoutLog, 'id' | 'userId'> = {
                workoutName: selectedDay.focus,
                date: Timestamp.now(),
                exercises,
                durationMinutes: 60
            };

            await logWorkout(log);
            Alert.alert('Success', 'Workout logged successfully!', [
                { text: 'OK', onPress: () => navigation.navigate('Home') }
            ]);
        } catch (error) {
            Alert.alert('Error', 'Failed to log workout');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !selectedPlan) {
        return (
            <ScreenWrapper className="justify-center items-center">
                <ActivityIndicator size="large" color="#00E676" />
            </ScreenWrapper>
        );
    }

    if (!selectedPlan) {
        return (
            <ScreenWrapper>
                <StyledScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
                    <StyledAnimatedView entering={FadeInDown.delay(200).duration(800).springify()}>
                        <StyledText className="text-primary text-3xl font-bold mt-6 mb-6 text-center">Select a Plan</StyledText>
                    </StyledAnimatedView>

                    {plans.length === 0 ? (
                        <StyledText className="text-gray-400 text-center">No plans found. Generate one first!</StyledText>
                    ) : (
                        plans.map((plan, index) => (
                            <StyledAnimatedView
                                key={index}
                                entering={FadeInDown.delay(400 + (index * 100)).duration(800).springify()}
                            >
                                <StyledButton
                                    className="bg-surface/80 p-6 rounded-2xl mb-4 border border-gray-700 shadow-lg"
                                    onPress={() => setSelectedPlan(plan)}
                                >
                                    <StyledText className="text-white text-xl font-bold">{plan.split_name}</StyledText>
                                    <StyledText className="text-gray-400">{plan.days_per_week} Days/Week</StyledText>
                                </StyledButton>
                            </StyledAnimatedView>
                        ))
                    )}
                    <StyledButton onPress={() => navigation.goBack()} className="mt-4">
                        <StyledText className="text-gray-400 text-center">Back</StyledText>
                    </StyledButton>
                </StyledScrollView>
            </ScreenWrapper>
        );
    }

    if (!selectedDay) {
        return (
            <ScreenWrapper>
                <StyledScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
                    <StyledAnimatedView entering={FadeInDown.delay(200).duration(800).springify()}>
                        <StyledText className="text-primary text-2xl font-bold mt-6 mb-2 text-center">{selectedPlan.split_name}</StyledText>
                        <StyledText className="text-white text-lg mb-6 text-center">Select Today's Workout</StyledText>
                    </StyledAnimatedView>

                    {selectedPlan.routine.map((day, index) => (
                        <StyledAnimatedView
                            key={index}
                            entering={FadeInRight.delay(400 + (index * 100)).duration(800).springify()}
                        >
                            <StyledButton
                                className="bg-surface/80 p-6 rounded-2xl mb-4 border border-gray-700 shadow-lg"
                                onPress={() => setSelectedDay(day)}
                            >
                                <StyledText className="text-secondary text-xl font-bold">{day.day}</StyledText>
                                <StyledText className="text-white mt-1 font-medium">Focus: {day.focus}</StyledText>
                            </StyledButton>
                        </StyledAnimatedView>
                    ))}

                    <StyledButton onPress={() => setSelectedPlan(null)} className="mt-4">
                        <StyledText className="text-gray-400 text-center">Back to Plans</StyledText>
                    </StyledButton>
                </StyledScrollView>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper>
            <StyledScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
                <StyledAnimatedView entering={FadeInDown.delay(200).duration(800).springify()}>
                    <StyledText className="text-primary text-2xl font-bold mt-4 mb-6 text-center">{selectedDay.focus}</StyledText>
                </StyledAnimatedView>

                {selectedDay.exercises.map((exercise, exIdx) => (
                    <StyledAnimatedView
                        key={exIdx}
                        entering={FadeInDown.delay(400 + (exIdx * 100)).duration(800).springify()}
                        className="bg-surface/80 p-4 rounded-2xl mb-4 border border-gray-700 shadow-md"
                    >
                        <StyledText className="text-white text-lg font-bold mb-2">{exercise.name}</StyledText>
                        <StyledText className="text-gray-400 text-xs mb-3 italic">{exercise.weight_guidance}</StyledText>

                        {Array.from({ length: parseInt(exercise.sets) }).map((_, setIdx) => (
                            <StyledView key={setIdx} className="flex-row items-center mb-2 justify-between">
                                <StyledText className="text-gray-400 w-8 font-bold">#{setIdx + 1}</StyledText>
                                <StyledInput
                                    className="bg-background/50 text-white p-3 rounded-xl w-24 text-center border border-gray-700"
                                    placeholder="kg"
                                    placeholderTextColor="#444"
                                    keyboardType="numeric"
                                    onChangeText={(val) => handleLogChange(exIdx, setIdx, 'weight', val)}
                                />
                                <StyledInput
                                    className="bg-background/50 text-white p-3 rounded-xl w-24 text-center border border-gray-700"
                                    placeholder="reps"
                                    placeholderTextColor="#444"
                                    keyboardType="numeric"
                                    onChangeText={(val) => handleLogChange(exIdx, setIdx, 'reps', val)}
                                />
                            </StyledView>
                        ))}
                    </StyledAnimatedView>
                ))}

                <StyledAnimatedView entering={FadeInDown.delay(800).duration(800).springify()}>
                    <StyledButton
                        className="bg-secondary p-4 rounded-2xl mt-4 mb-8 shadow-lg shadow-secondary/40"
                        onPress={finishWorkout}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <StyledText className="text-white font-bold text-center text-lg">Finish Workout</StyledText>
                        )}
                    </StyledButton>
                </StyledAnimatedView>

                <StyledButton onPress={() => setSelectedDay(null)} className="mb-8">
                    <StyledText className="text-gray-400 text-center">Back to Days</StyledText>
                </StyledButton>
            </StyledScrollView>
        </ScreenWrapper>
    );
}
