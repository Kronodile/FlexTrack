import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styled } from 'nativewind';

const StyledSafeAreaView = styled(SafeAreaView);

interface ScreenWrapperProps {
    children: React.ReactNode;
    className?: string;
}

export default function ScreenWrapper({ children, className }: ScreenWrapperProps) {
    return (
        <LinearGradient
            colors={['#121212', '#1E1E1E', '#0f172a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
        >
            <StyledSafeAreaView className={`flex-1 ${className || ''}`}>
                <Animated.View
                    entering={FadeInDown.delay(100).duration(500).springify()}
                    style={{ flex: 1 }}
                >
                    {children}
                </Animated.View>
            </StyledSafeAreaView>
        </LinearGradient>
    );
}
