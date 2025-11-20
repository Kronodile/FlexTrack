import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, FlatList } from 'react-native';
import { styled } from 'nativewind';
import { generateWorkoutPlan, WorkoutPlan } from '../services/GeminiService';
import ScreenWrapper from '../components/ScreenWrapper';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useAuth } from '../context/AuthContext';
import { LocalStorageService } from '../services/LocalStorageService';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { equipmentList } from '../data/equipmentList';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledInput = styled(TextInput);
const StyledButton = styled(TouchableOpacity);
const StyledScrollView = styled(ScrollView);
const StyledAnimatedView = styled(Animated.View);

export default function WorkoutInputScreen({ navigation }: any) {
    const { signOut } = useAuth();
    const [equipment, setEquipment] = useState<string[]>([]);
    const [split, setSplit] = useState('');
    const [days, setDays] = useState('3');
    const [comments, setComments] = useState('');
    const [loading, setLoading] = useState(false);
    const [savedPlans, setSavedPlans] = useState<WorkoutPlan[]>([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Equipment Dropdown State
    const [equipmentSearch, setEquipmentSearch] = useState('');
    const [showEquipmentDropdown, setShowEquipmentDropdown] = useState(false);
    const [showEquipmentPreview, setShowEquipmentPreview] = useState(false);

    // Split State
    const splitOptions = ['Push/Pull/Legs', 'Upper/Lower', 'Full Body', 'Bro Split', 'Arnold Split', 'Custom'];

    const loadPlans = async () => {
        const plans = await LocalStorageService.getWorkoutPlans();
        setSavedPlans(plans);
        if (plans.length === 0) {
            setShowCreateForm(true);
        } else {
            setShowCreateForm(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadPlans();
            setIsMenuOpen(false);
        }, [])
    );

    const handleGenerate = async () => {
        if (equipment.length === 0 || !split || !days) {
            Alert.alert('Missing Input', 'Please fill in all fields.');
            return;
        }

        setLoading(true);
        try {
            const plan = await generateWorkoutPlan(equipment.join(', '), split, parseInt(days), comments);
            navigation.navigate('WorkoutDisplay', { plan });
            setShowCreateForm(false);
        } catch (error: any) {
            Alert.alert('Error', 'Failed to generate workout. Check API Key.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const addEquipment = (item: string) => {
        if (!equipment.includes(item)) {
            setEquipment([...equipment, item]);
        }
        setEquipmentSearch('');
        setShowEquipmentDropdown(false);
    };

    const removeEquipment = (item: string) => {
        const newEquipment = equipment.filter(e => e !== item);
        setEquipment(newEquipment);
        if (newEquipment.length === 0) {
            setShowEquipmentPreview(false);
        }
    };

    const filteredEquipment = equipmentList.filter(item =>
        item.toLowerCase().includes(equipmentSearch.toLowerCase()) &&
        !equipment.includes(item)
    ).slice(0, 5);

    const renderSavedPlanItem = ({ item, index }: { item: WorkoutPlan, index: number }) => (
        <StyledAnimatedView entering={FadeInDown.delay(index * 100).springify()}>
            <StyledButton
                className="bg-surface p-5 rounded-2xl mb-4 border border-gray-700 shadow-sm"
                onPress={() => navigation.navigate('WorkoutLogging', { plan: item })}
            >
                <StyledText className="text-primary text-xl font-bold mb-1">{item.split_name}</StyledText>
                <StyledText className="text-gray-400">{item.days_per_week} Days/Week • {item.routine.length} Workouts</StyledText>
            </StyledButton>
        </StyledAnimatedView>
    );

    if (showCreateForm) {
        return (
            <ScreenWrapper>
                <StyledScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    <StyledView className="flex-row justify-between items-center mt-6 mb-2">
                        <StyledAnimatedView entering={FadeInDown.delay(200).duration(800).springify()}>
                            <StyledText className="text-primary text-4xl font-bold tracking-tight">Create Routine</StyledText>
                            <StyledText className="text-gray-400 text-lg">Tell us about your setup and goals.</StyledText>
                        </StyledAnimatedView>
                        <StyledView className="flex-row items-center">
                            {savedPlans.length > 0 && (
                                <StyledButton onPress={() => setShowCreateForm(false)} className="bg-surface/80 p-2 rounded-full">
                                    <StyledText className="text-gray-400 font-bold">Cancel</StyledText>
                                </StyledButton>
                            )}
                        </StyledView>
                    </StyledView>

                    <StyledAnimatedView entering={FadeInDown.delay(400).duration(800).springify()} className="flex-row justify-center mb-8 mt-4">
                        <StyledButton
                            className="bg-surface/80 p-4 rounded-2xl border border-gray-700 w-full items-center shadow-lg"
                            onPress={() => navigation.navigate('Progress')}
                        >
                            <StyledText className="text-secondary font-bold text-center">📈 Progress</StyledText>
                        </StyledButton>
                    </StyledAnimatedView>

                    <StyledView className="space-y-6">
                        {/* Equipment Section */}
                        <StyledAnimatedView entering={FadeInDown.delay(600).duration(800).springify()} className="z-50">
                            <StyledText className="text-white font-semibold mb-3 text-lg ml-1">Available Equipment</StyledText>
                            <StyledView className="relative z-50">
                                {equipment.length > 0 ? (
                                    <StyledButton
                                        className="bg-surface/60 p-4 rounded-2xl border border-gray-700 mb-2 min-h-[60px]"
                                        onPress={() => setShowEquipmentPreview(true)}
                                    >
                                        <StyledText className="text-gray-400 text-sm mb-1">Selected (Tap to edit):</StyledText>
                                        <StyledText className="text-white text-base" numberOfLines={2}>
                                            {equipment.join(', ')}
                                        </StyledText>
                                    </StyledButton>
                                ) : (
                                    <StyledView className="bg-surface/60 p-4 rounded-2xl border border-gray-700 mb-2 min-h-[60px] justify-center">
                                        <StyledText className="text-gray-500 italic">No equipment selected yet.</StyledText>
                                    </StyledView>
                                )}

                                {/* Equipment Preview Modal */}
                                {showEquipmentPreview && (
                                    <StyledView className="absolute top-0 left-0 right-0 bg-surface border border-gray-700 rounded-2xl shadow-2xl z-[100] p-4">
                                        <StyledView className="flex-row justify-between items-center mb-4 border-b border-gray-800 pb-2">
                                            <StyledText className="text-white font-bold text-lg">Selected Equipment</StyledText>
                                            <StyledButton onPress={() => setShowEquipmentPreview(false)}>
                                                <Ionicons name="close-circle" size={24} color="#9CA3AF" />
                                            </StyledButton>
                                        </StyledView>
                                        <StyledScrollView className="max-h-60" nestedScrollEnabled>
                                            {equipment.map((item, index) => (
                                                <StyledView key={index} className="flex-row justify-between items-center py-3 border-b border-gray-800/50">
                                                    <StyledText className="text-white text-base flex-1 mr-2">{item}</StyledText>
                                                    <StyledButton onPress={() => removeEquipment(item)} className="bg-red-500/20 p-2 rounded-full">
                                                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                                    </StyledButton>
                                                </StyledView>
                                            ))}
                                        </StyledScrollView>
                                    </StyledView>
                                )}

                                <StyledInput
                                    className="bg-surface/60 text-white p-4 rounded-2xl border border-gray-700 focus:border-primary text-lg"
                                    placeholder="Search & Add Equipment..."
                                    placeholderTextColor="#666"
                                    value={equipmentSearch}
                                    onChangeText={(text) => {
                                        setEquipmentSearch(text);
                                        setShowEquipmentDropdown(text.length > 0);
                                    }}
                                    onFocus={() => setShowEquipmentDropdown(true)}
                                />
                                {showEquipmentDropdown && equipmentSearch.length > 0 && (
                                    <StyledView className="absolute top-full left-0 right-0 bg-surface border border-gray-700 rounded-xl mt-2 shadow-xl z-50 max-h-60 overflow-hidden">
                                        <StyledButton
                                            className="p-4 border-b border-gray-800 bg-primary/10"
                                            onPress={() => addEquipment(equipmentSearch)}
                                        >
                                            <StyledText className="text-primary font-bold">Use "{equipmentSearch}"</StyledText>
                                        </StyledButton>
                                        {filteredEquipment.map((item, index) => (
                                            <StyledButton
                                                key={index}
                                                className="p-4 border-b border-gray-800 active:bg-gray-800"
                                                onPress={() => addEquipment(item)}
                                            >
                                                <StyledText className="text-white">{item}</StyledText>
                                            </StyledButton>
                                        ))}
                                    </StyledView>
                                )}
                            </StyledView>
                        </StyledAnimatedView>

                        {/* Split Section */}
                        <StyledAnimatedView entering={FadeInDown.delay(800).duration(800).springify()}>
                            <StyledText className="text-white font-semibold mb-3 text-lg ml-1">Preferred Split</StyledText>
                            <StyledView className="flex-row flex-wrap justify-between">
                                {splitOptions.map((option) => {
                                    const isSelected = split === option || (option === 'Custom' && !splitOptions.slice(0, 5).includes(split) && split !== '');
                                    return (
                                        <StyledButton
                                            key={option}
                                            className={`w-[48%] p-4 rounded-xl mb-3 border ${isSelected ? 'bg-primary border-primary' : 'bg-surface/60 border-gray-700'}`}
                                            onPress={() => {
                                                if (option === 'Custom') {
                                                    setSplit(''); // Clear split to show input
                                                } else {
                                                    setSplit(option);
                                                }
                                            }}
                                        >
                                            <StyledText className={`text-center font-bold ${isSelected ? 'text-black' : 'text-gray-400'}`}>
                                                {option}
                                            </StyledText>
                                        </StyledButton>
                                    );
                                })}
                            </StyledView>
                            {(!splitOptions.slice(0, 5).includes(split)) && (
                                <StyledInput
                                    className="bg-surface/60 text-white p-4 rounded-2xl border border-gray-700 focus:border-primary text-lg mt-2"
                                    placeholder="Enter custom split..."
                                    placeholderTextColor="#666"
                                    value={split}
                                    onChangeText={setSplit}
                                />
                            )}
                        </StyledAnimatedView>

                        {/* Days Section */}
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

                        {/* Comments Section */}
                        <StyledAnimatedView entering={FadeInDown.delay(1100).duration(800).springify()}>
                            <StyledText className="text-white font-semibold mb-3 text-lg ml-1">Additional Notes</StyledText>
                            <StyledInput
                                className="bg-surface/60 text-white p-4 rounded-2xl border border-gray-700 focus:border-primary text-lg min-h-[80px]"
                                placeholder="Injuries, focus areas, preferences..."
                                placeholderTextColor="#666"
                                value={comments}
                                onChangeText={setComments}
                                multiline
                                textAlignVertical="top"
                            />
                        </StyledAnimatedView>

                        <StyledAnimatedView entering={FadeInDown.delay(1200).duration(800).springify()}>
                            <StyledButton
                                className="bg-secondary p-5 rounded-2xl mt-8 shadow-lg shadow-secondary/40 mb-10"
                                onPress={handleGenerate}
                                disabled={loading}
                            >
                                {loading ? (
                                    <StyledView className="flex-row justify-center items-center">
                                        <ActivityIndicator color="white" size="small" />
                                        <StyledText className="text-white font-bold text-center text-lg ml-3">
                                            Crafting your routine...
                                        </StyledText>
                                    </StyledView>
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

    return (
        <ScreenWrapper>
            <StyledView className="flex-1 px-6">
                <StyledView className="flex-row justify-between items-center mt-6 mb-6 z-50">
                    <StyledAnimatedView entering={FadeInDown.delay(200).duration(800).springify()}>
                        <StyledText className="text-primary text-4xl font-bold tracking-tight">My Plans</StyledText>
                        <StyledText className="text-gray-400 text-lg">Select a plan to view details.</StyledText>
                    </StyledAnimatedView>

                    <StyledView className="relative">
                        <StyledButton
                            onPress={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-2 rounded-full bg-surface/80 border border-gray-700"
                        >
                            <Ionicons name="menu" size={24} color="white" />
                        </StyledButton>

                        {isMenuOpen && (
                            <StyledView className="absolute top-12 right-0 bg-surface border border-gray-700 rounded-xl shadow-xl p-2 min-w-[150px] z-50">
                                <StyledButton onPress={handleLogout} className="flex-row items-center p-3 rounded-lg active:bg-gray-800">
                                    <Ionicons name="log-out-outline" size={20} color="#EF4444" style={{ marginRight: 8 }} />
                                    <StyledText className="text-red-400 font-bold">Logout</StyledText>
                                </StyledButton>
                            </StyledView>
                        )}
                    </StyledView>
                </StyledView>

                {isMenuOpen && (
                    <TouchableOpacity
                        style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 40 }}
                        onPress={() => setIsMenuOpen(false)}
                        activeOpacity={1}
                    />
                )}

                <StyledAnimatedView entering={FadeInDown.delay(400).duration(800).springify()} className="flex-row justify-center mb-8">
                    <StyledButton
                        className="bg-surface/80 p-4 rounded-2xl border border-gray-700 w-full items-center shadow-lg"
                        onPress={() => navigation.navigate('Progress')}
                    >
                        <StyledText className="text-secondary font-bold text-center">📈 Progress</StyledText>
                    </StyledButton>
                </StyledAnimatedView>

                <FlatList
                    data={savedPlans}
                    renderItem={renderSavedPlanItem}
                    keyExtractor={(item, index) => index.toString()}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <StyledText className="text-gray-500 text-center mt-10">No saved plans found.</StyledText>
                    }
                />

                <StyledAnimatedView
                    entering={FadeInRight.delay(500).springify()}
                    className="absolute bottom-8 right-6"
                >
                    <StyledButton
                        className="bg-primary w-16 h-16 rounded-full items-center justify-center shadow-lg shadow-primary/40"
                        onPress={() => setShowCreateForm(true)}
                    >
                        <StyledText className="text-black text-4xl font-bold mb-1">+</StyledText>
                    </StyledButton>
                </StyledAnimatedView>
            </StyledView>
        </ScreenWrapper>
    );
}
