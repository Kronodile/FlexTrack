import React, { PropsWithChildren } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styled } from 'nativewind';

const StyledSafeAreaView = styled(SafeAreaView);

interface ScreenWrapperProps extends PropsWithChildren {
    className?: string;
}

export default function ScreenWrapper({ children, className }: ScreenWrapperProps) {
    return (
        <View style={StyleSheet.absoluteFillObject} className="bg-swiss-bg">
            <StyledSafeAreaView className={`flex-1 ${className || ''}`}>
                <Animated.View
                    entering={FadeInDown.delay(100).duration(500)}
                    style={{ flex: 1 }}
                >
                    {children}
                </Animated.View>
            </StyledSafeAreaView>
        </View>
    );
}
