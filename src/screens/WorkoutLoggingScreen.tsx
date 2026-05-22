import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Modal, TouchableOpacity, BackHandler } from 'react-native';
import { getUserPlans, logWorkout, WorkoutLog, updateWorkoutPlan, refreshUserPlans } from '../services/TrackingService';
import { WorkoutPlan, WorkoutDay } from '../services/GeminiService';
import { Timestamp } from 'firebase/firestore';
import ScreenWrapper from '../components/ScreenWrapper';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/ui/Button';
import { TextInput } from '../components/ui/TextInput';
import { Typography } from '../components/ui/Typography';
import { Card } from '../components/ui/Card';
import { DotsPattern } from '../components/patterns/DotsPattern';

export default function WorkoutLoggingScreen({ navigation, route }: any) {
    const [selectedPlan, setSelectedPlan] = useState<WorkoutPlan | null>(null);
    const [selectedDay, setSelectedDay] = useState<WorkoutDay | null>(null);
    const [loading, setLoading] = useState(true);
    const [logData, setLogData] = useState<any>({});
    const [exerciseSets, setExerciseSets] = useState<{ [key: number]: number }>({});
    const [exerciseInfo, setExerciseInfo] = useState<any>(null);
    const [isKg, setIsKg] = useState(true);

    useEffect(() => {
        const backAction = () => {
            if (selectedDay) {
                setSelectedDay(null);
                return true;
            }
            return false;
        };

        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            backAction
        );

        return () => backHandler.remove();
    }, [selectedDay]);

    const setUnit = (toKg: boolean) => {
        if (toKg === isKg) return; // already in that unit
        setLogData((prevLogData: any) => {
            const newData = { ...prevLogData };
            Object.keys(newData).forEach(exIdx => {
                const exData = { ...newData[exIdx as any] };
                Object.keys(exData).forEach(setIdx => {
                    const setEntry = { ...exData[setIdx as any] };
                    if (setEntry.weight) {
                        const weightNum = parseFloat(setEntry.weight);
                        if (!isNaN(weightNum)) {
                            const converted = isKg ? (weightNum * 2.20462) : (weightNum / 2.20462);
                            setEntry.weight = (Math.round(converted * 2) / 2).toString();
                        }
                    }
                    exData[setIdx as any] = setEntry;
                });
                newData[exIdx as any] = exData;
            });
            return newData;
        });
        setIsKg(toKg);
    };

    const initializedDayRef = useRef<string | null>(null);

    useEffect(() => {
        if (route.params?.plan) {
            setSelectedPlan(route.params.plan);
            setLoading(false);
        } else {
            Alert.alert('Error', 'No plan selected', [
                { text: 'Go Back', onPress: () => navigation.goBack() }
            ]);
        }
    }, [route.params]);

    useFocusEffect(
        useCallback(() => {
            if (selectedPlan?.id) {
                refreshUserPlans().then(plans => {
                    const updatedPlan = plans.find((p: any) => p.id === selectedPlan.id);
                    if (updatedPlan) {
                        setSelectedPlan(updatedPlan);
                        if (selectedDay) {
                            const updatedDay = updatedPlan.routine.find((d: any) => d.day === selectedDay.day);
                            if (updatedDay) {
                                initializedDayRef.current = null;
                                setSelectedDay(updatedDay);
                            }
                        }
                    }
                }).catch(err => {
                    console.error('Error refreshing plan:', err);
                });
            }
        }, [selectedPlan?.id, selectedDay?.day])
    );

    useEffect(() => {
        if (selectedDay) {
            if (initializedDayRef.current !== selectedDay.day) {
                initializedDayRef.current = selectedDay.day;

                const initialSets: { [key: number]: number } = {};
                const initialLogData: any = {};

                selectedDay.exercises.forEach((ex, idx) => {
                    initialSets[idx] = parseInt(ex.sets);

                    if (ex.last_logged_data && Array.isArray(ex.last_logged_data)) {
                        initialLogData[idx] = {};
                        ex.last_logged_data.forEach((setData: any, setIdx: number) => {
                            initialLogData[idx][setIdx] = {
                                weight: setData.weight?.toString() || '',
                                reps: setData.reps?.toString() || ''
                            };
                        });
                    }
                });

                setExerciseSets(initialSets);
                setLogData(initialLogData);
            }
        } else {
            initializedDayRef.current = null;
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

    const confirmDeleteSet = (exerciseIndex: number, setIndex: number) => {
        Alert.alert(
            "Delete Set",
            "Are you sure you want to delete this set?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => handleDeleteSet(exerciseIndex, setIndex) }
            ]
        );
    };

    const handleDeleteSet = (exerciseIndex: number, setIndex: number) => {
        setExerciseSets(prev => ({
            ...prev,
            [exerciseIndex]: Math.max(0, (prev[exerciseIndex] || 0) - 1)
        }));

        setLogData((prev: any) => {
            const newData = { ...prev };
            if (!newData[exerciseIndex]) return newData;

            const exerciseData = newData[exerciseIndex];
            const maxSet = Math.max(...Object.keys(exerciseData).map(Number));

            for (let i = setIndex; i < maxSet; i++) {
                exerciseData[i] = exerciseData[i + 1];
            }
            delete exerciseData[maxSet];

            newData[exerciseIndex] = exerciseData;
            return newData;
        });
    };

    const handleCopySet = (exerciseIndex: number, setIndex: number) => {
        if (setIndex === 0) return;

        const prevSetData = logData[exerciseIndex]?.[setIndex - 1];
        if (prevSetData) {
            setLogData((prev: any) => {
                const newData = { ...prev };
                if (!newData[exerciseIndex]) newData[exerciseIndex] = {};
                if (!newData[exerciseIndex][setIndex]) newData[exerciseIndex][setIndex] = {};

                newData[exerciseIndex][setIndex] = { ...prevSetData };
                return newData;
            });
        }
    };

    const validateInput = (exerciseIndex: number, setIndex: number, field: 'weight' | 'reps') => {
        const value = logData[exerciseIndex]?.[setIndex]?.[field];
        if (!value) return;

        const num = parseFloat(value);
        if (isNaN(num)) return;

        const rounded = Math.round(num * 2) / 2;

        if (rounded !== num) {
            handleLogChange(exerciseIndex, setIndex, field, rounded.toString());
            Alert.alert('Adjusted', `Value rounded to nearest 0.5: ${rounded}`);
        }
    };

    const finishWorkout = async () => {
        if (!selectedDay || !selectedPlan) return;

        Alert.alert(
            "Finish Workout",
            "Are you sure you want to finish this workout?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Finish",
                    onPress: async () => {
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
                                durationMinutes: 60
                            };

                            await logWorkout(log);

                            if (selectedPlan.id) {
                                const updatedRoutine = selectedPlan.routine.map(day => {
                                    if (day.day === selectedDay.day) {
                                        return {
                                            ...day,
                                            exercises: day.exercises.map((ex, idx) => {
                                                const loggedSets = exercises[idx]?.sets || [];
                                                return {
                                                    ...ex,
                                                    last_logged_data: loggedSets,
                                                    weight_guidance: loggedSets.length > 0
                                                        ? `Last: ${Math.max(...loggedSets.map(s => s.weight))}kg`
                                                        : ex.weight_guidance
                                                };
                                            })
                                        };
                                    }
                                    return day;
                                });

                                await updateWorkoutPlan(selectedPlan.id, { routine: updatedRoutine });
                            }

                            Alert.alert('Success', 'Workout logged and plan updated!', [
                                { text: 'OK', onPress: () => navigation.navigate('Home') }
                            ]);
                        } catch (error) {
                            Alert.alert('Error', 'Failed to log workout');
                            console.error(error);
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <ScreenWrapper className="bg-swiss-bg justify-center items-center">
                <DotsPattern />
                <ActivityIndicator size="large" color="#FF3000" />
            </ScreenWrapper>
        );
    }

    if (!selectedDay) {
        return (
            <ScreenWrapper className="bg-swiss-bg">
                <DotsPattern />
                <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
                    <Animated.View entering={FadeInDown.delay(200).duration(800)}>
                        <Typography variant="h2" className="mt-6 mb-2 text-center">{selectedPlan?.split_name}</Typography>
                        <Typography variant="body" className="mb-6 text-center font-inter-bold text-swiss-fg">SELECT TODAY'S WORKOUT</Typography>
                    </Animated.View>

                    {selectedPlan?.routine.map((day, index) => (
                        <Animated.View
                            key={index}
                            entering={FadeInRight.delay(400 + (index * 100)).duration(800)}
                        >
                            <Card 
                                interactive 
                                accentOnHover
                                onPress={() => setSelectedDay(day)}
                                className="mb-4"
                            >
                                <Typography variant="h3">{day.day}</Typography>
                                <Typography variant="label" className="mt-2">FOCUS: {day.focus}</Typography>
                            </Card>
                        </Animated.View>
                    ))}

                    <Animated.View entering={FadeInDown.delay(600).duration(800)}>
                        <Button 
                            title="VIEW FULL PLAN"
                            onPress={() => navigation.navigate('WorkoutDisplay', { plan: selectedPlan, isSaved: true })} 
                            className="mt-4"
                        />
                        <Button 
                            title="BACK TO HOME"
                            variant="outline"
                            onPress={() => navigation.goBack()} 
                            className="mt-4 border-transparent bg-transparent"
                        />
                    </Animated.View>
                </ScrollView>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper className="bg-swiss-bg">
            <DotsPattern />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    <View className="flex-row justify-between items-center mt-6 mb-6">
                        <Animated.View entering={FadeInDown.delay(200).duration(800)} className="flex-1 mr-4">
                            <Typography variant="h2" numberOfLines={2}>{selectedDay.focus}</Typography>
                        </Animated.View>
                        <View style={{ flexDirection: 'row', borderWidth: 4, borderColor: '#000000' }}>
                            <TouchableOpacity
                                onPress={() => setUnit(true)}
                                style={{ paddingHorizontal: 14, paddingVertical: 8, backgroundColor: isKg ? '#000000' : '#FFFFFF' }}
                            >
                                <Typography variant="body" style={{ fontFamily: 'Inter_700Bold', color: isKg ? '#FF3000' : '#000000' }}>KG</Typography>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setUnit(false)}
                                style={{ paddingHorizontal: 14, paddingVertical: 8, backgroundColor: !isKg ? '#000000' : '#FFFFFF' }}
                            >
                                <Typography variant="body" style={{ fontFamily: 'Inter_700Bold', color: !isKg ? '#FF3000' : '#000000' }}>LBS</Typography>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {selectedDay.exercises.map((exercise, exIdx) => (
                        <Animated.View
                            key={exIdx}
                            entering={FadeInDown.delay(400 + (exIdx * 100)).duration(800)}
                            className="bg-swiss-bg p-4 border-4 border-swiss-fg mb-6"
                        >
                            <View className="flex-row justify-between items-start mb-2 border-b-2 border-swiss-muted pb-2">
                                <Typography variant="h3" className="flex-1 mr-2 flex-wrap">{exercise.name}</Typography>
                                <TouchableOpacity onPress={() => setExerciseInfo(exercise)} className="p-1 border-2 border-swiss-fg active:bg-swiss-fg">
                                    <Ionicons name="information-outline" size={24} color="#000000" />
                                </TouchableOpacity>
                            </View>
                            
                            <Typography variant="label" className="mb-2">
                                PLAN: {exercise.sets} SETS × {exercise.reps} REPS
                            </Typography>
                            
                            <View className="flex-row items-center mb-6">
                                <Typography variant="body" className="font-inter-bold text-swiss-accent uppercase tracking-widest mr-2 text-sm">
                                    TARGET: {exercise.weight_guidance}
                                </Typography>
                            </View>

                            <View className="space-y-4">
                                {Array.from({ length: exerciseSets[exIdx] || 0 }).map((_, setIdx) => (
                                    <Animated.View
                                        key={setIdx}
                                        entering={FadeInDown.duration(400)}
                                        className="flex-row items-center mb-2"
                                    >
                                        {/* Set number — fixed width */}
                                        <Typography variant="number" style={{ width: 36 }}>#{setIdx + 1}</Typography>

                                        {/* Weight input — fixed width */}
                                        <View style={{ width: 80, marginRight: 8 }}>
                                            <TextInput
                                                label=""
                                                placeholder={isKg ? "KG" : "LBS"}
                                                keyboardType="numeric"
                                                value={logData[exIdx]?.[setIdx]?.weight || ''}
                                                onChangeText={(val) => handleLogChange(exIdx, setIdx, 'weight', val)}
                                                onEndEditing={() => validateInput(exIdx, setIdx, 'weight')}
                                            />
                                        </View>

                                        {/* Reps input — fixed width */}
                                        <View style={{ width: 72, marginRight: 8 }}>
                                            <TextInput
                                                label=""
                                                placeholder="REPS"
                                                keyboardType="numeric"
                                                value={logData[exIdx]?.[setIdx]?.reps || ''}
                                                onChangeText={(val) => handleLogChange(exIdx, setIdx, 'reps', val)}
                                                onEndEditing={() => validateInput(exIdx, setIdx, 'reps')}
                                            />
                                        </View>

                                        {/* Copy button — always same fixed width so delete stays aligned */}
                                        <View style={{ width: 52, marginRight: 8 }}>
                                            {setIdx > 0 ? (
                                                <TouchableOpacity
                                                    onPress={() => handleCopySet(exIdx, setIdx)}
                                                    style={{ borderWidth: 2, borderColor: '#000000', paddingVertical: 6, alignItems: 'center' }}
                                                >
                                                    <Typography variant="label" style={{ fontSize: 9, lineHeight: 12 }}>COPY</Typography>
                                                    <Typography variant="label" style={{ fontSize: 9, lineHeight: 12 }}>ABOVE</Typography>
                                                </TouchableOpacity>
                                            ) : null}
                                        </View>

                                        {/* Delete button — always in same column */}
                                        <TouchableOpacity
                                            onPress={() => confirmDeleteSet(exIdx, setIdx)}
                                            style={{ borderWidth: 2, borderColor: '#000000', padding: 10 }}
                                        >
                                            <Ionicons name="trash-outline" size={18} color="#000000" />
                                        </TouchableOpacity>
                                    </Animated.View>
                                ))}
                            </View>

                            <TouchableOpacity
                                onPress={() => handleAddSet(exIdx)}
                                className="bg-swiss-muted p-3 mt-4 border-2 border-swiss-fg items-center active:bg-swiss-fg"
                            >
                                <Typography variant="label" className="text-swiss-accent">+ ADD SET</Typography>
                            </TouchableOpacity>
                        </Animated.View>
                    ))}

                    <Animated.View entering={FadeInDown.delay(800).duration(800)} className="mb-12">
                        <Button
                            title={loading ? "FINISHING..." : "FINISH WORKOUT"}
                            onPress={finishWorkout}
                            disabled={loading}
                        />
                        <Button 
                            title="BACK TO DAYS" 
                            variant="outline" 
                            onPress={() => setSelectedDay(null)} 
                            className="mt-4 border-transparent bg-transparent"
                        />
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Exercise Info Modal */}
            <Modal
                visible={!!exerciseInfo}
                transparent={true}
                animationType="none"
                onRequestClose={() => setExerciseInfo(null)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ width: 320, backgroundColor: '#FFFFFF', borderWidth: 4, borderColor: '#000000', padding: 24 }}>
                        <View className="flex-row justify-between items-start mb-6 border-b-4 border-swiss-fg pb-4">
                            <Typography variant="h3" className="flex-1 mr-4">{exerciseInfo?.name}</Typography>
                            <TouchableOpacity onPress={() => setExerciseInfo(null)}>
                                <Ionicons name="close-outline" size={32} color="#000000" />
                            </TouchableOpacity>
                        </View>
                        <View className="space-y-4">
                            <View>
                                <Typography variant="label" className="mb-1">SETS & REPS</Typography>
                                <Typography variant="body" className="font-inter-bold">{exerciseInfo?.sets} SETS × {exerciseInfo?.reps}</Typography>
                            </View>
                            <View>
                                <Typography variant="label" className="mb-1">TARGET</Typography>
                                <Typography variant="body" className="font-inter-bold text-swiss-accent">{exerciseInfo?.weight_guidance}</Typography>
                            </View>
                            <View>
                                <Typography variant="label" className="mb-1">REST</Typography>
                                <Typography variant="body" className="font-inter-bold">{exerciseInfo?.rest}</Typography>
                            </View>
                            {exerciseInfo?.notes && (
                                <View>
                                    <Typography variant="label" className="mb-1">NOTES</Typography>
                                    <Typography variant="body" className="italic">{exerciseInfo?.notes}</Typography>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </Modal>

        </ScreenWrapper>
    );
}
