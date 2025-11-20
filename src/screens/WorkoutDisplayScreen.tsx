import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { styled } from 'nativewind';
import { WorkoutPlan } from '../services/GeminiService';
import { saveWorkoutPlan } from '../services/TrackingService';
import ScreenWrapper from '../components/ScreenWrapper';
import Animated, { FadeInDown } from 'react-native-reanimated';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledScrollView = styled(ScrollView);
const StyledButton = styled(TouchableOpacity);

const StyledAnimatedView = styled(Animated.View);

export default function WorkoutDisplayScreen({ route, navigation }: any) {
    const { plan } = route.params as { plan: WorkoutPlan };
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await saveWorkoutPlan(plan);
            Alert.alert('Success', 'Workout plan saved to your profile!', [
                { text: 'OK', onPress: () => navigation.navigate('Home') }
            ]);
        } catch (error: any) {
            Alert.alert('Error', 'Failed to save plan: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <ScreenWrapper>
            <StyledScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
                <StyledAnimatedView entering={FadeInDown.delay(200).duration(800).springify()}>
                    <StyledText className="text-primary text-3xl font-bold mt-4 mb-2 text-center tracking-tight">
                        {plan.split_name}
                    </StyledText>
                    <StyledText className="text-gray-400 text-center mb-8 text-lg">
                        {plan.days_per_week} Days / Week
                    </StyledText>
                </StyledAnimatedView>

                {plan.routine.map((day, index) => (
                    <StyledAnimatedView
                        key={index}
                        entering={FadeInDown.delay(400 + (index * 200)).duration(800).springify()}
                        className="bg-surface/80 p-5 rounded-2xl mb-6 border border-gray-700 shadow-lg"
                    >
                        <StyledView className="flex-row justify-between items-center mb-3">
                            <StyledText className="text-secondary text-2xl font-bold">{day.day}</StyledText>
                            <StyledView className="bg-primary/10 px-3 py-1 rounded-full">
                                <StyledText className="text-primary text-xs font-bold uppercase">{day.focus}</StyledText>
                            </StyledView>
                        </StyledView>

                        <StyledText className="text-gray-400 text-sm mb-4 italic border-b border-gray-700 pb-3">
                            🔥 Warmup: {day.warmup}
                        </StyledText>

                        {day.exercises.map((exercise, idx) => (
                            <StyledView key={idx} className="mb-4 pl-3 border-l-2 border-secondary/50">
                                <StyledText className="text-white font-bold text-lg">{exercise.name}</StyledText>
                                <StyledView className="flex-row justify-between mt-1">
                                    <StyledText className="text-gray-300 text-sm font-medium">
                                        {exercise.sets} sets x {exercise.reps}
                                    </StyledText>
                                    <StyledText className="text-gray-500 text-sm">
                                        ⏱ {exercise.rest}
                                    </StyledText>
                                </StyledView>
                                <StyledText className="text-primary/80 text-xs mt-1 font-medium">{exercise.weight_guidance}</StyledText>
                                {exercise.notes && <StyledText className="text-gray-500 text-xs mt-1 italic">{exercise.notes}</StyledText>}
                            </StyledView>
                        ))}
                    </StyledAnimatedView>
                ))}

                <StyledAnimatedView entering={FadeInDown.delay(1000).duration(800).springify()} className="flex-row justify-between mb-10 mt-4">
                    <StyledButton
                        className="bg-surface p-4 rounded-2xl flex-1 mr-3 border border-gray-700"
                        onPress={() => navigation.goBack()}
                    >
                        <StyledText className="text-gray-300 font-bold text-center text-lg">Back</StyledText>
                    </StyledButton>

                    {!route.params?.isSaved && (
                        <StyledButton
                            className="bg-primary p-4 rounded-2xl flex-1 ml-3 shadow-lg shadow-primary/20"
                            onPress={handleSave}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator color="black" />
                            ) : (
                                <StyledText className="text-black font-bold text-center text-lg">Save Plan</StyledText>
                            )}
                        </StyledButton>
                    )}
                </StyledAnimatedView>
            </StyledScrollView>
        </ScreenWrapper>
    );
}
