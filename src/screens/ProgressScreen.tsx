import React, { useEffect, useState } from 'react';
import {
    View, ScrollView, ActivityIndicator, Alert,
    TouchableOpacity, Modal
} from 'react-native';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { FIREBASE_DB, FIREBASE_AUTH } from '../firebaseConfig';
import { WorkoutLog, deleteWorkoutLog } from '../services/TrackingService';
import { generateProgressSummary } from '../services/GeminiService';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Typography } from '../components/ui/Typography';
import { DiagonalPattern } from '../components/patterns/DiagonalPattern';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

// ─── Helpers ────────────────────────────────────────────────────────────────

const KG_TO_LBS = 2.20462;

function convert(kg: number, toKg: boolean): number {
    return toKg ? kg : Math.round(kg * KG_TO_LBS * 2) / 2;
}

function unitLabel(isKg: boolean): string {
    return isKg ? 'KG' : 'LBS';
}

function formatDate(seconds: number): string {
    return new Date(seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDateLong(seconds: number): string {
    return new Date(seconds * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function computeStreak(logs: WorkoutLog[]): number {
    if (logs.length === 0) return 0;
    const sorted = [...logs].sort((a, b) => b.date.seconds - a.date.seconds);
    let streak = 1;
    for (let i = 1; i < sorted.length; i++) {
        const diff = sorted[i - 1].date.seconds - sorted[i].date.seconds;
        if (diff <= 86400 * 2) streak++;
        else break;
    }
    return streak;
}

// ─── Strength Progression (per exercise) ──────────────────────────────────

function getStrengthProgressions(logs: WorkoutLog[], isKg: boolean) {
    // For each exercise, track max weight across sessions
    const exerciseHistory: Record<string, { date: number; maxWeight: number; maxReps: number }[]> = {};

    const sortedLogs = [...logs].sort((a, b) => a.date.seconds - b.date.seconds);

    for (const log of sortedLogs) {
        for (const ex of log.exercises) {
            if (!exerciseHistory[ex.name]) exerciseHistory[ex.name] = [];
            let maxW = 0;
            let maxR = 0;
            for (const set of ex.sets) {
                if (set.weight > maxW) {
                    maxW = set.weight;
                    maxR = set.reps;
                }
            }
            if (maxW > 0) {
                exerciseHistory[ex.name].push({
                    date: log.date.seconds,
                    maxWeight: maxW,
                    maxReps: maxR,
                });
            }
        }
    }

    // Only show exercises with 2+ data points and compute delta
    return Object.entries(exerciseHistory)
        .filter(([_, history]) => history.length >= 2)
        .map(([name, history]) => {
            const first = history[0];
            const last = history[history.length - 1];
            const delta = last.maxWeight - first.maxWeight;
            return {
                name,
                history,
                firstWeight: convert(first.maxWeight, isKg),
                lastWeight: convert(last.maxWeight, isKg),
                delta: convert(delta, isKg),
                deltaPercent: first.maxWeight > 0 ? ((delta / first.maxWeight) * 100).toFixed(0) : '0',
                sessions: history.length,
            };
        })
        .sort((a, b) => b.sessions - a.sessions)
        .slice(0, 8);
}

// ─── PR Tracker ──────────────────────────────────────────────────────────────

function computePRs(logs: WorkoutLog[], isKg: boolean) {
    const prMap: Record<string, { weight: number; reps: number; date: string }> = {};
    for (const log of logs) {
        for (const ex of log.exercises) {
            for (const set of ex.sets) {
                if (!set.weight) continue;
                const existing = prMap[ex.name];
                if (!existing || set.weight > existing.weight) {
                    prMap[ex.name] = { weight: set.weight, reps: set.reps, date: formatDate(log.date.seconds) };
                }
            }
        }
    }
    return Object.entries(prMap)
        .map(([name, v]) => ({ name, weight: convert(v.weight, isKg), reps: v.reps, date: v.date }))
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 6);
}

// ─── Weekly Frequency Dots ───────────────────────────────────────────────────

function FrequencyDots({ logs }: { logs: WorkoutLog[] }) {
    const now = Date.now();
    const days = Array.from({ length: 7 }, (_, i) => {
        const dayStart = now - (6 - i) * 86400000;
        const dayEnd = dayStart + 86400000;
        const hit = logs.some(l => {
            const ms = l.date.seconds * 1000;
            return ms >= dayStart && ms < dayEnd;
        });
        return { hit, label: new Date(dayStart).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2) };
    });

    return (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            {days.map((d, i) => (
                <View key={i} style={{ alignItems: 'center', gap: 4 }}>
                    <View style={{
                        width: 32, height: 32,
                        backgroundColor: d.hit ? '#FF3000' : '#F2F2F2',
                        borderWidth: 2, borderColor: '#000000',
                    }} />
                    <Typography variant="label" style={{ fontSize: 9 }}>{d.label}</Typography>
                </View>
            ))}
        </View>
    );
}

// ─── Strength Mini Chart (per exercise) ──────────────────────────────────────

function StrengthMiniChart({ history, isKg }: { history: { date: number; maxWeight: number }[]; isKg: boolean }) {
    const weights = history.map(h => convert(h.maxWeight, isKg));
    const maxW = Math.max(...weights, 1);
    const minW = Math.min(...weights, 0);
    const range = maxW - minW || 1;
    const BAR_H = 36;

    return (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: BAR_H, gap: 2, marginTop: 8 }}>
            {history.map((h, i) => {
                const w = convert(h.maxWeight, isKg);
                const barH = Math.max(4, ((w - minW) / range) * BAR_H);
                const isLast = i === history.length - 1;
                return (
                    <View key={i} style={{
                        flex: 1, height: barH,
                        backgroundColor: isLast ? '#FF3000' : '#000000',
                    }} />
                );
            })}
        </View>
    );
}

// ─── Workout Detail Modal ────────────────────────────────────────────────────

function WorkoutDetailModal({ log, isKg, onClose }: { log: WorkoutLog | null; isKg: boolean; onClose: () => void }) {
    if (!log) return null;
    return (
        <Modal visible transparent animationType="slide" onRequestClose={onClose}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                <View style={{ backgroundColor: '#FFFFFF', borderTopWidth: 4, borderColor: '#000000', maxHeight: '85%' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 2, borderColor: '#000000' }}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                            <Typography variant="h3">{log.workoutName}</Typography>
                            <Typography variant="label" style={{ marginTop: 4, color: '#FF3000' }}>
                                {formatDateLong(log.date.seconds)}
                            </Typography>
                        </View>
                        <TouchableOpacity onPress={onClose} style={{ borderWidth: 2, borderColor: '#000000', padding: 4 }}>
                            <Ionicons name="close" size={24} color="#000000" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={{ padding: 20 }}>
                        {log.exercises.map((ex, i) => (
                            <View key={i} style={{ marginBottom: 20 }}>
                                <Typography variant="label" style={{ marginBottom: 8, color: '#000000' }}>{ex.name}</Typography>
                                <View style={{ flexDirection: 'row', borderBottomWidth: 2, borderColor: '#000000', paddingBottom: 4, marginBottom: 4 }}>
                                    <Typography variant="label" style={{ width: 36, fontSize: 10 }}>SET</Typography>
                                    <Typography variant="label" style={{ flex: 1, fontSize: 10 }}>WEIGHT</Typography>
                                    <Typography variant="label" style={{ flex: 1, fontSize: 10 }}>REPS</Typography>
                                </View>
                                {ex.sets.map((set, si) => (
                                    <View key={si} style={{ flexDirection: 'row', paddingVertical: 4, borderBottomWidth: 1, borderColor: '#F2F2F2' }}>
                                        <Typography variant="body" style={{ width: 36, fontFamily: 'Inter_700Bold', fontSize: 13, color: '#FF3000' }}>#{si + 1}</Typography>
                                        <Typography variant="body" style={{ flex: 1, fontFamily: 'Inter_700Bold', fontSize: 13 }}>
                                            {convert(set.weight, isKg)} {unitLabel(isKg)}
                                        </Typography>
                                        <Typography variant="body" style={{ flex: 1, fontFamily: 'Inter_700Bold', fontSize: 13 }}>{set.reps}</Typography>
                                    </View>
                                ))}
                            </View>
                        ))}
                        <View style={{ height: 40 }} />
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

// ─── Unit Toggle Component ────────────────────────────────────────────────────

function UnitToggle({ isKg, onSetKg, onSetLbs }: { isKg: boolean; onSetKg: () => void; onSetLbs: () => void }) {
    return (
        <View style={{ flexDirection: 'row', borderWidth: 4, borderColor: '#000000' }}>
            <TouchableOpacity
                onPress={onSetKg}
                style={{ paddingHorizontal: 14, paddingVertical: 8, backgroundColor: isKg ? '#000000' : '#FFFFFF' }}
            >
                <Typography variant="body" style={{ fontFamily: 'Inter_700Bold', color: isKg ? '#FF3000' : '#000000' }}>KG</Typography>
            </TouchableOpacity>
            <TouchableOpacity
                onPress={onSetLbs}
                style={{ paddingHorizontal: 14, paddingVertical: 8, backgroundColor: !isKg ? '#000000' : '#FFFFFF' }}
            >
                <Typography variant="body" style={{ fontFamily: 'Inter_700Bold', color: !isKg ? '#FF3000' : '#000000' }}>LBS</Typography>
            </TouchableOpacity>
        </View>
    );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function ProgressScreen({ navigation }: any) {
    const [logs, setLogs] = useState<WorkoutLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<WorkoutLog | null>(null);
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [isKg, setIsKg] = useState(true);

    useFocusEffect(
        useCallback(() => {
            fetchLogs();
        }, [])
    );

    const fetchLogs = async () => {
        const user = FIREBASE_AUTH.currentUser;
        if (!user) return;
        try {
            const q = query(
                collection(FIREBASE_DB, "workoutLogs"),
                where("userId", "==", user.uid),
                limit(50)
            );
            const snap = await getDocs(q);
            const fetched = snap.docs
                .map(d => ({ id: d.id, ...d.data() } as WorkoutLog))
                .sort((a, b) => b.date.seconds - a.date.seconds);
            setLogs(fetched);
        } catch (e) {
            Alert.alert('Error', 'Failed to load progress');
        } finally {
            setLoading(false);
        }
    };

    const fetchAiSummary = async () => {
        if (logs.length === 0) return;
        setAiLoading(true);
        const stripped = logs.slice(0, 10).map(l => ({
            name: l.workoutName,
            date: formatDate(l.date.seconds),
            exercises: l.exercises.map(e => ({
                name: e.name,
                maxWeight: Math.max(...e.sets.map(x => x.weight)),
                totalSets: e.sets.length,
                avgReps: Math.round(e.sets.reduce((s, x) => s + x.reps, 0) / e.sets.length),
            }))
        }));
        const summary = await generateProgressSummary(JSON.stringify(stripped, null, 2));
        setAiSummary(summary);
        setAiLoading(false);
    };

    const handleDeleteLog = (log: WorkoutLog) => {
        Alert.alert("Delete Workout", `Delete workout from ${formatDate(log.date.seconds)}?`, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete", style: "destructive", onPress: async () => {
                    await deleteWorkoutLog(log.id!);
                    fetchLogs();
                }
            }
        ]);
    };

    if (loading) {
        return (
            <ScreenWrapper className="bg-swiss-bg justify-center items-center">
                <DiagonalPattern />
                <ActivityIndicator size="large" color="#FF3000" />
            </ScreenWrapper>
        );
    }

    const streak = computeStreak(logs);
    const prs = computePRs(logs, isKg);
    const progressions = getStrengthProgressions(logs, isKg);

    return (
        <ScreenWrapper className="bg-swiss-bg">
            <DiagonalPattern />
            <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>

                {/* ── Header + Unit Toggle ── */}
                <Animated.View entering={FadeInDown.delay(100).duration(400)} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 16 }}>
                    <View>
                        <Typography variant="h2">PROGRESS</Typography>
                        <Typography variant="body" style={{ fontSize: 11, color: '#888', marginTop: 2 }}>🚧 work in progress</Typography>
                    </View>
                    <UnitToggle
                        isKg={isKg}
                        onSetKg={() => setIsKg(true)}
                        onSetLbs={() => setIsKg(false)}
                    />
                </Animated.View>

                {/* ── Stats Row ── */}
                <Animated.View entering={FadeInDown.delay(150).duration(400)} style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                    {[
                        { val: logs.length, label: 'SESSIONS' },
                        { val: `${streak}🔥`, label: 'STREAK' },
                        { val: prs.length > 0 ? `${prs[0].weight}` : '—', label: `TOP PR (${unitLabel(isKg)})` },
                    ].map((s, i) => (
                        <View key={i} style={{
                            flex: 1, borderWidth: 4, borderColor: '#000000',
                            backgroundColor: i === 2 ? '#000000' : '#FFFFFF',
                            padding: 12, alignItems: 'center',
                        }}>
                            <Typography variant="h2" style={{ color: i === 2 ? '#FF3000' : '#000000', fontSize: 24 }}>
                                {s.val}
                            </Typography>
                            <Typography variant="label" style={{ color: i === 2 ? '#FFFFFF' : '#000000', fontSize: 8, marginTop: 2 }}>
                                {s.label}
                            </Typography>
                        </View>
                    ))}
                </Animated.View>

                {/* ── 7-Day Frequency ── */}
                <Animated.View entering={FadeInDown.delay(200).duration(400)} style={{ marginBottom: 16 }}>
                    <View style={{ borderWidth: 4, borderColor: '#000000', padding: 16, backgroundColor: '#FFFFFF' }}>
                        <Typography variant="label" style={{ marginBottom: 12 }}>THIS WEEK</Typography>
                        <FrequencyDots logs={logs} />
                    </View>
                </Animated.View>

                {/* ── Strength Progressions ── */}
                {progressions.length > 0 && (
                    <Animated.View entering={FadeInDown.delay(250).duration(400)} style={{ marginBottom: 16 }}>
                        <View style={{ borderWidth: 4, borderColor: '#000000', padding: 16, backgroundColor: '#FFFFFF' }}>
                            <Typography variant="label" style={{ marginBottom: 12 }}>📈 STRENGTH PROGRESSION</Typography>
                            {progressions.map((p, i) => (
                                <View key={i} style={{
                                    paddingVertical: 10,
                                    borderBottomWidth: i < progressions.length - 1 ? 1 : 0,
                                    borderColor: '#F2F2F2'
                                }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="body" style={{ fontFamily: 'Inter_700Bold', fontSize: 12, flex: 1, marginRight: 8 }} numberOfLines={1}>
                                            {p.name}
                                        </Typography>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <Typography variant="label" style={{ fontSize: 10, color: '#888' }}>
                                                {p.firstWeight} → {p.lastWeight} {unitLabel(isKg)}
                                            </Typography>
                                            <View style={{
                                                backgroundColor: p.delta >= 0 ? '#000000' : '#FF3000',
                                                paddingHorizontal: 6, paddingVertical: 2
                                            }}>
                                                <Typography variant="label" style={{ color: p.delta >= 0 ? '#00FF00' : '#FFFFFF', fontSize: 9 }}>
                                                    {p.delta >= 0 ? '↑' : '↓'}{Math.abs(p.delta)} {unitLabel(isKg)}
                                                </Typography>
                                            </View>
                                        </View>
                                    </View>
                                    <StrengthMiniChart history={p.history} isKg={isKg} />
                                    <Typography variant="label" style={{ fontSize: 8, color: '#888', marginTop: 4 }}>
                                        {p.sessions} SESSIONS · {p.deltaPercent}% CHANGE
                                    </Typography>
                                </View>
                            ))}
                        </View>
                    </Animated.View>
                )}

                {/* ── PR Board ── */}
                {prs.length > 0 && (
                    <Animated.View entering={FadeInDown.delay(300).duration(400)} style={{ marginBottom: 16 }}>
                        <View style={{ borderWidth: 4, borderColor: '#000000', padding: 16, backgroundColor: '#FFFFFF' }}>
                            <Typography variant="label" style={{ marginBottom: 12 }}>🏆 PERSONAL RECORDS</Typography>
                            {prs.map((pr, i) => (
                                <View key={i} style={{
                                    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                                    paddingVertical: 8,
                                    borderBottomWidth: i < prs.length - 1 ? 1 : 0,
                                    borderColor: '#F2F2F2'
                                }}>
                                    <View style={{ flex: 1, marginRight: 8 }}>
                                        <Typography variant="body" style={{ fontFamily: 'Inter_700Bold', fontSize: 13 }} numberOfLines={1}>
                                            {pr.name}
                                        </Typography>
                                        <Typography variant="label" style={{ fontSize: 9, color: '#888', marginTop: 2 }}>{pr.date}</Typography>
                                    </View>
                                    <View style={{ backgroundColor: '#000000', paddingHorizontal: 8, paddingVertical: 4 }}>
                                        <Typography variant="label" style={{ color: '#FF3000', fontSize: 12 }}>
                                            {pr.weight} {unitLabel(isKg)} × {pr.reps}
                                        </Typography>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </Animated.View>
                )}

                {/* ── AI Coach Summary ── */}
                <Animated.View entering={FadeInDown.delay(350).duration(400)} style={{ marginBottom: 16 }}>
                    <View style={{ borderWidth: 4, borderColor: '#000000', padding: 16, backgroundColor: '#000000' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <Typography variant="label" style={{ color: '#FF3000' }}>✦ AI COACH ANALYSIS</Typography>
                            <TouchableOpacity
                                onPress={fetchAiSummary}
                                disabled={aiLoading || logs.length === 0}
                                style={{ borderWidth: 2, borderColor: '#FF3000', paddingHorizontal: 10, paddingVertical: 4 }}
                            >
                                <Typography variant="label" style={{ color: '#FF3000', fontSize: 9 }}>
                                    {aiLoading ? 'ANALYSING...' : 'GENERATE'}
                                </Typography>
                            </TouchableOpacity>
                        </View>
                        {aiLoading ? (
                            <ActivityIndicator color="#FF3000" style={{ marginTop: 8 }} />
                        ) : aiSummary ? (
                            <Typography variant="body" style={{ color: '#FFFFFF', lineHeight: 22 }}>
                                {aiSummary}
                            </Typography>
                        ) : (
                            <Typography variant="body" style={{ color: '#888' }}>
                                Tap GENERATE for an AI-powered breakdown of your recent training.
                            </Typography>
                        )}
                    </View>
                </Animated.View>

                {/* ── Recent History ── */}
                <Animated.View entering={FadeInDown.delay(400).duration(400)} style={{ marginBottom: 8 }}>
                    <Typography variant="label" style={{ marginBottom: 12 }}>RECENT HISTORY</Typography>
                </Animated.View>

                {logs.length === 0 ? (
                    <Typography variant="body" style={{ textAlign: 'center', marginTop: 8, color: '#888' }}>
                        No workouts logged yet. Get to work! 💪
                    </Typography>
                ) : (
                    logs.slice(0, 20).map((log, i) => (
                        <Animated.View key={log.id} entering={FadeInUp.delay(450 + i * 40).duration(400)} style={{ marginBottom: 10 }}>
                            <TouchableOpacity
                                onPress={() => setSelectedLog(log)}
                                activeOpacity={0.85}
                                style={{ borderWidth: 3, borderColor: '#000000', backgroundColor: '#FFFFFF', padding: 14 }}
                            >
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <View style={{ flex: 1, marginRight: 8 }}>
                                        <Typography variant="h3" style={{ fontSize: 14 }}>{log.workoutName}</Typography>
                                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
                                            <Typography variant="label" style={{ fontSize: 9, color: '#888' }}>
                                                {formatDateLong(log.date.seconds)}
                                            </Typography>
                                            <Typography variant="label" style={{ fontSize: 9, color: '#FF3000' }}>
                                                {log.exercises.length} EXERCISES
                                            </Typography>
                                        </View>
                                    </View>
                                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                                        <View style={{ backgroundColor: '#F2F2F2', paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: '#000' }}>
                                            <Typography variant="label" style={{ fontSize: 9 }}>VIEW</Typography>
                                        </View>
                                        <TouchableOpacity onPress={() => handleDeleteLog(log)} style={{ padding: 4 }}>
                                            <Ionicons name="trash-outline" size={16} color="#FF3000" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </Animated.View>
                    ))
                )}

                <View style={{ height: 40 }} />
            </ScrollView>

            <WorkoutDetailModal log={selectedLog} isKg={isKg} onClose={() => setSelectedLog(null)} />
        </ScreenWrapper>
    );
}
