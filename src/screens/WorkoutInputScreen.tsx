import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { styled } from 'nativewind';
import { generateWorkoutPlan, WorkoutPlan } from '../services/GeminiService';
import ScreenWrapper from '../components/ScreenWrapper';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledInput = styled(TextInput);
const StyledButton = styled(TouchableOpacity);
const StyledScrollView = styled(ScrollView);

const StyledAnimatedView = styled(Animated.View);

export default function WorkoutInputScreen({ navigation }: any) {
    const [equipment, setEquipment] = useState('');
    const [split, setSplit] = useState('');
    const [days, setDays] = useState('3');
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        if (!equipment || !split || !days) {
            Alert.alert('Missing Input', 'Please fill in all fields.');
            return;
        }

        setLoading(true);
        try {
            const plan = await generateWorkoutPlan(equipment, split, parseInt(days));
            navigation.navigate('WorkoutDisplay', { plan });
        } catch (error: any) {
            Alert.alert('Error', 'Failed to generate workout. Check API Key.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScreenWrapper>
            <StyledScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
                <StyledAnimatedView entering={FadeInDown.delay(200).duration(800).springify()}>
                    <StyledText className="text-primary text-4xl font-bold mt-6 mb-2 tracking-tight">Create Routine</StyledText>
                    <StyledText className="text-gray-400 mb-8 text-lg">Tell us about your setup and goals.</StyledText>
                </StyledAnimatedView>

                <StyledAnimatedView entering={FadeInDown.delay(400).duration(800).springify()} className="flex-row justify-between mb-8">
                    <StyledButton
                        className="bg-surface/80 p-4 rounded-2xl border border-gray-700 flex-1 mr-2 items-center shadow-lg"
                        onPress={() => navigation.navigate('WorkoutLogging')}
                    >
                        <StyledText className="text-white font-bold text-center">💪 Logger</StyledText>
                    </StyledButton>

                    <StyledButton
                        className="bg-surface/80 p-4 rounded-2xl border border-gray-700 flex-1 ml-2 items-center shadow-lg"
                        onPress={() => navigation.navigate('Progress')}
                    >
                        <StyledText className="text-secondary font-bold text-center">📈 Progress</StyledText>
                    </StyledButton>
                </StyledAnimatedView>

                <StyledView className="space-y-6">
                    <StyledAnimatedView entering={FadeInDown.delay(600).duration(800).springify()}>
                        <StyledText className="text-white font-semibold mb-3 text-lg ml-1">Available Equipment</StyledText>
                        <StyledInput
                            className="bg-surface/60 text-white p-4 rounded-2xl border border-gray-700 focus:border-primary text-lg min-h-[100px]"
                            placeholder="e.g., Dumbbells, Bench, Pull-up bar..."
                            placeholderTextColor="#666"
                            value={equipment}
                            onChangeText={setEquipment}
                            multiline
                            textAlignVertical="top"
                        />
                    </StyledAnimatedView>

                    <StyledAnimatedView entering={FadeInDown.delay(800).duration(800).springify()}>
                        <StyledText className="text-white font-semibold mb-3 text-lg ml-1">Preferred Split</StyledText>
                        <StyledInput
                            className="bg-surface/60 text-white p-4 rounded-2xl border border-gray-700 focus:border-primary text-lg"
                            placeholder="e.g., Push/Pull/Legs, Upper/Lower..."
                            placeholderTextColor="#666"
                            value={split}
                            onChangeText={setSplit}
                        />
                    </StyledAnimatedView>

                    <StyledAnimatedView entering={FadeInDown.delay(1000).duration(800).springify()}>
                        <StyledText className="text-white font-semibold mb-3 text-lg ml-1">Days per Week: {days}</StyledText>
                        <StyledView className="flex-row justify-between bg-surface/60 p-2 rounded-2xl border border-gray-700">
                            {[3, 4, 5, 6].map((d, index) => (
                                <StyledAnimatedView
                                    key={d}
                                    entering={FadeInRight.delay(1000 + (index * 100)).springify()}
                                    className="flex-1"
                                >
                                    <StyledButton
                                        className={`p-4 rounded-xl flex-1 mx-1 ${days === d.toString() ? 'bg-primary shadow-md shadow-primary/30' : 'bg-transparent'}`}
                                        onPress={() => setDays(d.toString())}
                                    >
                                        <StyledText className={`text-center font-bold text-lg ${days === d.toString() ? 'text-black' : 'text-gray-400'}`}>
                                            {d}
                                        </StyledText>
                                    </StyledButton>
                                </StyledAnimatedView>
                            ))}
                        </StyledView>
                    </StyledAnimatedView>

                    <StyledAnimatedView entering={FadeInDown.delay(1200).duration(800).springify()}>
                        <StyledButton
                            className="bg-secondary p-5 rounded-2xl mt-8 shadow-lg shadow-secondary/40 mb-10"
                            onPress={handleGenerate}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <StyledText className="text-white font-bold text-center text-xl">Generate Workout</StyledText>
                            )}
                        </StyledButton>
                    </StyledAnimatedView>
                </StyledView>
            </StyledScrollView>
        </ScreenWrapper>
    );
}
