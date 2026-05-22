import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, ActivityIndicator, Alert, FlatList, Modal, TouchableOpacity } from 'react-native';
import { generateWorkoutPlan, WorkoutPlan } from '../services/GeminiService';
import { getUserPlans, refreshUserPlans, deleteWorkoutPlan } from '../services/TrackingService';
import ScreenWrapper from '../components/ScreenWrapper';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useAuth } from '../context/AuthContext';
import { LocalStorageService } from '../services/LocalStorageService';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { equipmentList } from '../data/equipmentList';
import { Button } from '../components/ui/Button';
import { TextInput } from '../components/ui/TextInput';
import { Typography } from '../components/ui/Typography';
import { Card } from '../components/ui/Card';
import { GridPattern } from '../components/patterns/GridPattern';

export default function WorkoutInputScreen({ navigation }: any) {
    const { signOut } = useAuth();
    const [equipment, setEquipment] = useState<string[]>([]);
    const [split, setSplit] = useState('');
    const [days, setDays] = useState('3');
    const [level, setLevel] = useState('Beginner');
    const [weight, setWeight] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('Male');
    const [comments, setComments] = useState('');
    const [loading, setLoading] = useState(false);
    const [savedPlans, setSavedPlans] = useState<WorkoutPlan[]>([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const [selectedPlanForPreview, setSelectedPlanForPreview] = useState<WorkoutPlan | null>(null);
    const [previewModalVisible, setPreviewModalVisible] = useState(false);

    const [equipmentSearch, setEquipmentSearch] = useState('');
    const [showEquipmentDropdown, setShowEquipmentDropdown] = useState(false);
    const [showEquipmentPreview, setShowEquipmentPreview] = useState(false);

    const splitOptions = ['Push/Pull/Legs', 'Upper/Lower', 'Full Body', 'Bro Split', 'Arnold Split', 'Custom'];
    const levelOptions = ['Beginner', 'Novice', 'Intermediate', 'Advanced'];
    const genderOptions = ['Male', 'Female', 'Other'];

    const equipmentPresets = [
        { name: "Home Gym", items: ["Dumbbells", "Resistance Bands", "Yoga Mat"] },
        { name: "Basic Gym", items: ["Barbell", "Dumbbells", "Bench", "Pull-up Bar", "Squat Rack"] },
        { name: "Advanced Gym", items: ["Barbell", "Dumbbells", "Bench", "Pull-up Bar", "Squat Rack", "Cable Machine", "Leg Press", "Kettlebells"] }
    ];

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
            if (!loading) return;
            e.preventDefault();
            Alert.alert(
                'Workout Generation in Progress',
                'Please wait until the workout is generated before navigating away.',
                [{ text: 'OK' }]
            );
        });
        return unsubscribe;
    }, [navigation, loading]);

    const loadPlans = async () => {
        const localPlans = await getUserPlans();
        setSavedPlans(localPlans);
        if (localPlans.length === 0) setShowCreateForm(true);
        else setShowCreateForm(false);
        refreshUserPlans().then(freshPlans => {
            if (freshPlans.length > 0) setSavedPlans(freshPlans);
        });
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
            const plan = await generateWorkoutPlan(equipment.join(', '), split, parseInt(days), level, weight, age, gender, comments);
            navigation.navigate('WorkoutDisplay', { plan });
            setShowCreateForm(false);
        } catch (error: any) {
            Alert.alert('Error', 'Failed to generate workout.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await LocalStorageService.clearAllData();
            await signOut();
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const addEquipment = (item: string) => {
        if (!equipment.includes(item)) setEquipment([...equipment, item]);
        setEquipmentSearch('');
        setShowEquipmentDropdown(false);
    };

    const removeEquipment = (item: string) => {
        const newEquipment = equipment.filter(e => e !== item);
        setEquipment(newEquipment);
        if (newEquipment.length === 0) setShowEquipmentPreview(false);
    };

    const filteredEquipment = equipmentList.filter(item =>
        item.toLowerCase().includes(equipmentSearch.toLowerCase()) &&
        !equipment.includes(item)
    ).slice(0, 5);

    const handlePlanLongPress = (plan: WorkoutPlan) => {
        setSelectedPlanForPreview(plan);
        setPreviewModalVisible(true);
    };

    const confirmDeletePlan = (plan: WorkoutPlan) => {
        Alert.alert(
            "Delete Plan",
            "Are you sure you want to delete this workout plan?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        if (plan.id) {
                            await deleteWorkoutPlan(plan.id);
                            setPreviewModalVisible(false);
                            loadPlans();
                        }
                    }
                }
            ]
        );
    };

    const renderSavedPlanItem = ({ item, index }: { item: WorkoutPlan, index: number }) => (
        <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
            <Card 
                interactive 
                accentOnHover
                onPress={() => navigation.navigate('WorkoutLogging', { plan: item })}
                onLongPress={() => handlePlanLongPress(item)}
                delayLongPress={500}
                className="mb-4"
            >
                <Typography variant="h3" className="mb-2">{item.split_name}</Typography>
                <Typography variant="body" className="font-inter-bold">{item.days_per_week} DAYS/WEEK • {item.routine.length} WORKOUTS</Typography>
            </Card>
        </Animated.View>
    );

    if (showCreateForm) {
        return (
            <ScreenWrapper className="bg-swiss-bg">
                <GridPattern />
                <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" scrollEnabled={!showEquipmentPreview}>
                    <View className="flex-row justify-between items-center mt-6 mb-8">
                        <Animated.View entering={FadeInDown.delay(200).duration(800)}>
                            <Typography variant="h2">CREATE</Typography>
                            <Typography variant="h2">ROUTINE</Typography>
                            <Typography variant="body" className="mt-2">DEFINE SYSTEM PARAMETERS.</Typography>
                        </Animated.View>
                        {savedPlans.length > 0 && (
                            <Button 
                                title="CANCEL" 
                                variant="outline" 
                                onPress={() => setShowCreateForm(false)} 
                                fullWidth={false}
                                className="px-4 py-2"
                            />
                        )}
                    </View>

                    <Animated.View entering={FadeInDown.delay(400).duration(800)} className="mb-8">
                        <Button
                            title="PROGRESS TRACKING"
                            variant="outline"
                            onPress={() => navigation.navigate('Progress')}
                        />
                    </Animated.View>

                    <View className="space-y-12">
                        <Animated.View entering={FadeInDown.delay(500).duration(800)} className="z-40 border-t-4 border-swiss-fg pt-6">
                            <Typography variant="h3" className="mb-6"><Typography variant="number">01.</Typography> PROFILE</Typography>
                            <View className="flex-row mb-6 w-full">
                                <View className="flex-1 mr-2"><TextInput label="AGE" placeholder="AGE" keyboardType="numeric" value={age} onChangeText={setAge} /></View>
                                <View className="flex-1 ml-2"><TextInput label="WEIGHT" placeholder="KG/LBS" value={weight} onChangeText={setWeight} /></View>
                            </View>
                            <Typography variant="label" className="mb-2">GENDER</Typography>
                            <View className="flex-row justify-between mb-6 border-3 border-swiss-fg bg-swiss-bg p-1">
                                {genderOptions.map((g) => (
                                    <TouchableOpacity key={g} className={`p-3 flex-1 items-center justify-center border border-transparent ${gender === g ? 'bg-swiss-fg' : 'bg-transparent'}`} onPress={() => setGender(g)}>
                                        <Typography variant="body" className={`font-inter-bold text-center uppercase tracking-widest ${gender === g ? 'text-swiss-bg' : 'text-swiss-fg'}`}>{g}</Typography>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <Typography variant="label" className="mb-2">EXPERIENCE LEVEL</Typography>
                            <View className="flex-row flex-wrap justify-between">
                                {levelOptions.map((opt) => (
                                    <TouchableOpacity key={opt} className={`w-[48%] p-4 mb-3 border-3 ${level === opt ? 'bg-swiss-fg border-swiss-fg' : 'bg-swiss-bg border-swiss-fg'}`} onPress={() => setLevel(opt)}>
                                        <Typography variant="body" className={`font-inter-bold text-center uppercase tracking-widest ${level === opt ? 'text-swiss-bg' : 'text-swiss-fg'}`}>{opt}</Typography>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(600).duration(800)} className="z-50 border-t-4 border-swiss-fg pt-6">
                            <Typography variant="h3" className="mb-6"><Typography variant="number">02.</Typography> EQUIPMENT</Typography>
                            <View className="flex-row flex-wrap justify-between mb-6">
                                {equipmentPresets.map((preset) => (
                                    <TouchableOpacity key={preset.name} className="bg-swiss-muted p-2 px-3 mb-2 border-3 border-swiss-fg" onPress={() => setEquipment([...new Set([...equipment, ...preset.items])])}>
                                        <Typography variant="label" className="font-inter-bold text-swiss-accent">+ {preset.name}</Typography>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <View className="relative z-50 mb-6">
                                {equipment.length > 0 ? (
                                    <TouchableOpacity className="bg-swiss-bg p-4 border-3 border-swiss-fg mb-4" onPress={() => setShowEquipmentPreview(true)}>
                                        <Typography variant="label" className="mb-2">SELECTED (TAP TO EDIT):</Typography>
                                        <Typography variant="body" className="font-inter-bold uppercase tracking-widest" numberOfLines={2}>{equipment.join(', ')}</Typography>
                                    </TouchableOpacity>
                                ) : (
                                    <View className="bg-swiss-muted p-4 border-3 border-swiss-fg mb-4 justify-center">
                                        <Typography variant="body" className="font-inter-bold text-swiss-fg">NO EQUIPMENT SELECTED.</Typography>
                                    </View>
                                )}
                                <Modal visible={showEquipmentPreview} transparent={true} animationType="none" onRequestClose={() => setShowEquipmentPreview(false)}>
                                    <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center' }}>
                                        <View style={{ width: 320, backgroundColor: '#FFFFFF', borderWidth: 4, borderColor: '#000000', padding: 24 }}>
                                            <View className="flex-row justify-between items-center mb-6 border-b-4 border-swiss-fg pb-4">
                                                <Typography variant="h3">EQUIPMENT</Typography>
                                                <TouchableOpacity onPress={() => setShowEquipmentPreview(false)}><Ionicons name="close-outline" size={32} color="#000000" /></TouchableOpacity>
                                            </View>
                                            <FlatList data={equipment} keyExtractor={(item, index) => `equipment-${index}`} style={{ height: 300 }} renderItem={({ item }) => (
                                                <View className="flex-row justify-between items-center py-4 border-b-2 border-swiss-muted">
                                                    <Typography variant="body" className="font-inter-bold uppercase tracking-widest flex-1 mr-2">{item}</Typography>
                                                    <TouchableOpacity onPress={() => removeEquipment(item)} className="p-2 border-2 border-swiss-fg"><Ionicons name="trash-outline" size={20} color="#FF3000" /></TouchableOpacity>
                                                </View>
                                            )} />
                                        </View>
                                    </View>
                                </Modal>
                                <TextInput label="SEARCH & ADD EQUIPMENT" placeholder="SEARCH..." value={equipmentSearch} onChangeText={(text) => { setEquipmentSearch(text); setShowEquipmentDropdown(text.length > 0); }} onFocus={() => setShowEquipmentDropdown(true)} />
                                {showEquipmentDropdown && equipmentSearch.length > 0 && (
                                    <View className="absolute top-full left-0 right-0 bg-swiss-bg border-3 border-swiss-fg mt-2 z-50 max-h-60 overflow-hidden">
                                        <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                                            <TouchableOpacity className="p-4 border-b-2 border-swiss-muted bg-swiss-muted" onPress={() => addEquipment(equipmentSearch)}><Typography variant="body" className="font-inter-bold uppercase tracking-widest text-swiss-accent">USE "{equipmentSearch}"</Typography></TouchableOpacity>
                                            {filteredEquipment.map((item, index) => (
                                                <TouchableOpacity key={index} className="p-4 border-b-2 border-swiss-muted active:bg-swiss-muted" onPress={() => addEquipment(item)}><Typography variant="body" className="font-inter-bold uppercase tracking-widest">{item}</Typography></TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}
                            </View>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(800).duration(800)} className="border-t-4 border-swiss-fg pt-6">
                            <Typography variant="h3" className="mb-6"><Typography variant="number">03.</Typography> SPLIT</Typography>
                            <View className="flex-row flex-wrap justify-between mb-4">
                                {splitOptions.map((option) => {
                                    const isSelected = split === option || (option === 'Custom' && !splitOptions.slice(0, 5).includes(split) && split !== '');
                                    return (
                                        <TouchableOpacity key={option} className={`w-[48%] p-4 mb-4 border-3 ${isSelected ? 'bg-swiss-fg border-swiss-fg' : 'bg-swiss-bg border-swiss-fg'}`} onPress={() => option === 'Custom' ? setSplit('') : setSplit(option)}>
                                            <Typography variant="body" className={`font-inter-bold text-center uppercase tracking-widest ${isSelected ? 'text-swiss-bg' : 'text-swiss-fg'}`}>{option}</Typography>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                            {(!splitOptions.slice(0, 5).includes(split)) && <TextInput label="CUSTOM SPLIT" placeholder="ENTER CUSTOM SPLIT..." value={split} onChangeText={setSplit} />}
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(1000).duration(800)} className="border-t-4 border-swiss-fg pt-6">
                            <Typography variant="h3" className="mb-6"><Typography variant="number">04.</Typography> SCHEDULE</Typography>
                            <Typography variant="label" className="mb-2">DAYS PER WEEK: {days}</Typography>
                            <View className="flex-row justify-between bg-swiss-bg border-3 border-swiss-fg p-1 mb-6">
                                {[3, 4, 5, 6].map((d) => (
                                    <TouchableOpacity key={d} className={`p-4 flex-1 items-center justify-center border border-transparent ${days === d.toString() ? 'bg-swiss-fg' : 'bg-transparent'}`} onPress={() => setDays(d.toString())}>
                                        <Typography variant="h3" className={`${days === d.toString() ? 'text-swiss-bg' : 'text-swiss-fg'}`}>{d}</Typography>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(1100).duration(800)} className="border-t-4 border-swiss-fg pt-6">
                            <Typography variant="h3" className="mb-6"><Typography variant="number">05.</Typography> NOTES</Typography>
                            <TextInput label="ADDITIONAL INSTRUCTIONS" placeholder="INJURIES, FOCUS AREAS, PREFERENCES..." value={comments} onChangeText={setComments} multiline textAlignVertical="top" style={{ minHeight: 120 }} />
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(1200).duration(800)} className="mb-12">
                            <Button title={loading ? "GENERATING..." : "GENERATE WORKOUT"} onPress={handleGenerate} disabled={loading} />
                        </Animated.View>
                    </View>
                </ScrollView>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper className="bg-swiss-bg">
            <GridPattern />
            <View className="flex-1 px-6">
                <View className="flex-row justify-between items-center mt-6 mb-8 z-50">
                    <Animated.View entering={FadeInDown.delay(200).duration(800)}>
                        <Typography variant="h1">SYSTEM</Typography>
                        <Typography variant="h1">PLANS</Typography>
                    </Animated.View>
                    <View className="relative">
                        <Button title="MENU" variant="outline" onPress={() => setIsMenuOpen(!isMenuOpen)} fullWidth={false} className="px-4 py-2" />
                        {isMenuOpen && (
                            <View className="absolute top-16 right-0 bg-swiss-bg border-4 border-swiss-fg p-2 min-w-[200px] z-50">
                                <TouchableOpacity onPress={handleLogout} className="flex-row items-center p-4 border-2 border-transparent active:border-swiss-accent"><Typography variant="body" className="font-inter-bold text-swiss-accent tracking-widest uppercase">LOGOUT</Typography></TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
                {isMenuOpen && <TouchableOpacity style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 40 }} onPress={() => setIsMenuOpen(false)} activeOpacity={1} />}
                <Animated.View entering={FadeInDown.delay(400).duration(800)} className="mb-8"><Button title="PROGRESS TRACKING" variant="outline" onPress={() => navigation.navigate('Progress')} /></Animated.View>
                <FlatList data={savedPlans} renderItem={renderSavedPlanItem} keyExtractor={(item, index) => index.toString()} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false} ListEmptyComponent={<View className="mt-10 border-4 border-swiss-fg p-8 bg-swiss-bg"><Typography variant="h3" className="text-center">NO PLANS LOCATED.</Typography></View>} />
                <Animated.View entering={FadeInRight.delay(500)} className="absolute bottom-8 right-6">
                    <TouchableOpacity className="bg-swiss-fg w-20 h-20 items-center justify-center border-4 border-swiss-fg" onPress={() => setShowCreateForm(true)}><Typography variant="h1" className="text-swiss-bg leading-none">+</Typography></TouchableOpacity>
                </Animated.View>
                {previewModalVisible && selectedPlanForPreview && (
                    <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 100 }}>
                        <TouchableOpacity style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(255,255,255,0.9)' }} onPress={() => setPreviewModalVisible(false)} activeOpacity={1} />
                        <View className="absolute bottom-0 left-0 right-0 bg-swiss-bg border-t-4 border-swiss-fg p-8">
                            <View className="flex-row justify-between items-start mb-8">
                                <View className="flex-1"><Typography variant="h2">{selectedPlanForPreview.split_name}</Typography><Typography variant="body" className="font-inter-bold mt-2">{selectedPlanForPreview.days_per_week} DAYS / WEEK • {selectedPlanForPreview.routine.length} WORKOUTS</Typography></View>
                                <TouchableOpacity onPress={() => setPreviewModalVisible(false)} className="ml-4"><Ionicons name="close-outline" size={40} color="#000000" /></TouchableOpacity>
                            </View>
                            <View className="space-y-4 pb-8">
                                <Button title="VIEW PLAN" onPress={() => { setPreviewModalVisible(false); navigation.navigate('WorkoutDisplay', { plan: selectedPlanForPreview, isSaved: true }); }} />
                                <Button title="REFINE PLAN" variant="outline" onPress={() => { setPreviewModalVisible(false); navigation.navigate('WorkoutDisplay', { plan: selectedPlanForPreview, isSaved: true, showRefine: true }); }} />
                                <Button title="DELETE PLAN" variant="outline" onPress={() => confirmDeletePlan(selectedPlanForPreview)} className="border-swiss-accent mt-4" />
                            </View>
                        </View>
                    </View>
                )}
            </View>
        </ScreenWrapper>
    );
}
