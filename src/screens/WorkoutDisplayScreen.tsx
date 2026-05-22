import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { WorkoutPlan, refineWorkoutPlan } from '../services/GeminiService';
import { saveWorkoutPlan } from '../services/TrackingService';
import ScreenWrapper from '../components/ScreenWrapper';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/ui/Button';
import { TextInput } from '../components/ui/TextInput';
import { Typography } from '../components/ui/Typography';
import { Card } from '../components/ui/Card';
import { DiagonalPattern } from '../components/patterns/DiagonalPattern';

export default function WorkoutDisplayScreen({ route, navigation }: any) {
    const { plan, isSaved: initialIsSaved, showRefine } = route.params as { plan: WorkoutPlan, isSaved?: boolean, showRefine?: boolean };
    const [currentPlan, setCurrentPlan] = useState<WorkoutPlan>(plan);
    const [isSaved, setIsSaved] = useState(!!initialIsSaved);
    const [saving, setSaving] = useState(false);
    const [refining, setRefining] = useState(false);
    const [refineModalVisible, setRefineModalVisible] = useState(false);
    const [refineInstructions, setRefineInstructions] = useState('');
    const [collapsedDays, setCollapsedDays] = useState<Record<number, boolean>>({});

    const toggleDay = (index: number) => {
        setCollapsedDays(prev => ({ ...prev, [index]: !prev[index] }));
    };

    React.useEffect(() => {
        if (showRefine) {
            setRefineModalVisible(true);
        }
    }, [showRefine]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await saveWorkoutPlan(currentPlan);
            setIsSaved(true);
            Alert.alert('Success', 'Workout plan saved to your profile!', [
                { text: 'OK', onPress: () => navigation.navigate('Home') }
            ]);
        } catch (error: any) {
            Alert.alert('Error', 'Failed to save plan: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleRefine = async () => {
        if (!refineInstructions.trim()) {
            Alert.alert('Error', 'Please enter instructions for refinement.');
            return;
        }

        setRefining(true);
        try {
            const newPlan = await refineWorkoutPlan(currentPlan, refineInstructions);
            setCurrentPlan(newPlan);
            setIsSaved(false);
            setRefineModalVisible(false);
            setRefineInstructions('');
            Alert.alert('Success', 'Workout plan refined! You can now save this new version.');
        } catch (error: any) {
            Alert.alert('Error', 'Failed to refine plan. Please try again.');
            console.error(error);
        } finally {
            setRefining(false);
        }
    };

    return (
        <ScreenWrapper className="bg-swiss-bg">
            <DiagonalPattern />
            <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
                <Animated.View entering={FadeInDown.delay(200).duration(800)} className="mb-8 mt-6">
                    <Typography variant="h2" className="text-center">{currentPlan.split_name}</Typography>
                    <Typography variant="body" className="text-center font-inter-bold mt-2 uppercase tracking-widest text-swiss-fg">
                        {currentPlan.days_per_week} DAYS / WEEK
                    </Typography>
                </Animated.View>

                {currentPlan.routine.map((day, index) => (
                    <Animated.View
                        key={index}
                        entering={FadeInDown.delay(400 + (index * 200)).duration(800)}
                        className="mb-6"
                    >
                        <Card className="bg-swiss-bg">
                            <TouchableOpacity 
                                onPress={() => toggleDay(index)}
                                activeOpacity={0.7}
                            >
                                <View className="flex-row flex-wrap justify-between items-center mb-3">
                                    <View className="flex-row items-center mr-2">
                                        <Typography variant="number">{index + 1}.</Typography>
                                        <Typography variant="h3" className="mr-2">{day.day}</Typography>
                                        <Ionicons 
                                            name={collapsedDays[index] ? "add-outline" : "remove-outline"} 
                                            size={24} 
                                            color="#000000" 
                                        />
                                    </View>
                                    <View className="bg-swiss-fg px-3 py-1">
                                        <Typography variant="label" className="text-swiss-bg">{day.focus}</Typography>
                                    </View>
                                </View>
                            </TouchableOpacity>

                            {!collapsedDays[index] && (
                                <View className="mt-4 pt-4 border-t-4 border-swiss-fg">
                                    <Typography variant="body" className="font-inter-bold mb-6 text-swiss-accent uppercase tracking-widest">
                                        WARMUP: {day.warmup}
                                    </Typography>

                                    {day.exercises.map((exercise, idx) => (
                                        <View key={idx} className="mb-6 pl-4 border-l-4 border-swiss-fg">
                                            <Typography variant="h3" className="mb-2">{exercise.name}</Typography>
                                            <View className="flex-row justify-between mb-2">
                                                <Typography variant="label">
                                                    {exercise.sets} SETS × {exercise.reps}
                                                </Typography>
                                                <Typography variant="label">
                                                    REST: {exercise.rest}
                                                </Typography>
                                            </View>
                                            <Typography variant="body" className="font-inter-bold text-swiss-accent text-sm mb-1 uppercase tracking-widest">{exercise.weight_guidance}</Typography>
                                            {exercise.notes && <Typography variant="body" className="text-sm italic text-swiss-fg">{exercise.notes}</Typography>}
                                        </View>
                                    ))}
                                </View>
                            )}
                        </Card>
                    </Animated.View>
                ))}

                <Animated.View entering={FadeInDown.delay(1000).duration(800)} className="flex-col mb-12 space-y-4">
                    <View className="flex-row space-x-4 mb-4">
                        <View className="flex-1 mr-2">
                            <Button
                                title="REFINE"
                                variant="outline"
                                onPress={() => setRefineModalVisible(true)}
                            />
                        </View>
                        {!isSaved && (
                            <View className="flex-1 ml-2">
                                <Button
                                    title={saving ? "SAVING..." : "SAVE PLAN"}
                                    onPress={handleSave}
                                    disabled={saving}
                                />
                            </View>
                        )}
                    </View>

                    <Button
                        title="GO BACK"
                        variant="outline"
                        onPress={() => navigation.goBack()}
                        className="border-transparent bg-transparent"
                    />
                </Animated.View>
            </ScrollView>

            {/* Refine Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={refineModalVisible}
                onRequestClose={() => setRefineModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1, justifyContent: 'flex-end' }}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
                >
                    <View className="bg-swiss-bg border-t-4 border-swiss-fg p-8 h-1/2 shadow-2xl">
                        <View className="flex-row justify-between items-center mb-8 border-b-4 border-swiss-fg pb-4">
                            <Typography variant="h2">REFINE PLAN</Typography>
                            <TouchableOpacity onPress={() => setRefineModalVisible(false)}>
                                <Ionicons name="close-outline" size={40} color="#000000" />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            label="INSTRUCTIONS"
                            placeholder="WHAT WOULD YOU LIKE TO CHANGE?"
                            multiline
                            textAlignVertical="top"
                            style={{ minHeight: 120 }}
                            value={refineInstructions}
                            onChangeText={setRefineInstructions}
                        />

                        <Button
                            title={refining ? "APPLYING..." : "APPLY CHANGES"}
                            onPress={handleRefine}
                            disabled={refining}
                            className="mt-4"
                        />
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </ScreenWrapper>
    );
}
