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

export default function WorkoutLoggingScreen({ navigation, route }: any) {
    const [selectedPlan, setSelectedPlan] = useState<WorkoutPlan | null>(null);
    const [selectedDay, setSelectedDay] = useState<WorkoutDay | null>(null);
    const [loading, setLoading] = useState(true);
    const [logData, setLogData] = useState<any>({});
    const [exerciseSets, setExerciseSets] = useState<{ [key: number]: number }>({});

    useEffect(() => {
        if (route.params?.plan) {
            setSelectedPlan(route.params.plan);
            setLoading(false);
        } else {
            // Fallback if no plan provided (shouldn't happen with new flow)
            Alert.alert('Error', 'No plan selected', [
                { text: 'Go Back', onPress: () => navigation.goBack() }
            ]);
        }
    }, [route.params]);

    useEffect(() => {
        if (selectedDay) {
            // Initialize sets count based on plan
            const initialSets: { [key: number]: number } = {};
            selectedDay.exercises.forEach((ex, idx) => {
                initialSets[idx] = parseInt(ex.sets);
            });
            setExerciseSets(initialSets);
        }
    }, [selectedDay]);

    const handleLogChange = (exerciseIndex: number, setIndex: number, field: 'weight' | 'reps', value: string) => {
        setLogData((prev: any) => {
            const newData = { ...prev };
            if (!newData[exerciseIndex]) newData[exerciseIndex] = {};
            if (!newData[exerciseIndex][setIndex]) newData[exerciseIndex][setIndex] = {};
            newData[exerciseIndex][setIndex][field] = value;
            return newData;
        });
    };

    const handleAddSet = (exerciseIndex: number) => {
        setExerciseSets(prev => ({
            ...prev,
            [exerciseIndex]: (prev[exerciseIndex] || 0) + 1
        }));
    };

    const finishWorkout = async () => {
        if (!selectedDay || !selectedPlan) return;

        setLoading(true);
        try {
            const exercises = selectedDay.exercises.map((ex, exIdx) => ({
                name: ex.name,
                sets: Array.from({ length: exerciseSets[exIdx] || 0 }).map((_, setIdx) => ({
                    reps: parseInt(logData[exIdx]?.[setIdx]?.reps || '0'),
                    weight: parseFloat(logData[exIdx]?.[setIdx]?.weight || '0'),
                    completed: true
                }))
            }));

            const log: Omit<WorkoutLog, 'id' | 'userId'> = {
                workoutName: selectedDay.focus,
                date: Timestamp.now(),
                exercises,
                durationMinutes: 60 // TODO: Implement actual timer
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

    if (loading) {
        return (
            <ScreenWrapper className="justify-center items-center">
                <ActivityIndicator size="large" color="#00E676" />
            </ScreenWrapper>
        );
    }

    if (!selectedDay) {
        return (
            <ScreenWrapper>
                <StyledScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
                    <StyledAnimatedView entering={FadeInDown.delay(200).duration(800).springify()}>
                        <StyledText className="text-primary text-2xl font-bold mt-6 mb-2 text-center">{selectedPlan?.split_name}</StyledText>
                        <StyledText className="text-white text-lg mb-6 text-center">Select Today's Workout</StyledText>
                    </StyledAnimatedView>

                    {selectedPlan?.routine.map((day, index) => (
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

                    <StyledButton onPress={() => navigation.goBack()} className="mt-4">
                        <StyledText className="text-gray-400 text-center">Back to Home</StyledText>
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
                        layout={Layout.springify()}
                    >
                        <StyledText className="text-white text-lg font-bold mb-2">{exercise.name}</StyledText>
                        <StyledText className="text-gray-400 text-xs mb-3 italic">{exercise.weight_guidance}</StyledText>

                        {Array.from({ length: exerciseSets[exIdx] || 0 }).map((_, setIdx) => (
                            <StyledAnimatedView
                                key={setIdx}
                                entering={FadeInDown.duration(400)}
                                layout={Layout.springify()}
                                className="flex-row items-center mb-2 justify-between"
                            >
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
                            </StyledAnimatedView>
                        ))}

                        <StyledButton
                            onPress={() => handleAddSet(exIdx)}
                            className="bg-primary/20 p-2 rounded-xl mt-2 border border-primary/30 items-center"
                        >
                            <StyledText className="text-primary font-bold">+ Add Set</StyledText>
                        </StyledButton>
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
