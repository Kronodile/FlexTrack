import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { styled } from 'nativewind';
import { useAuth } from '../context/AuthContext';
import ScreenWrapper from '../components/ScreenWrapper';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledInput = styled(TextInput);
const StyledButton = styled(TouchableOpacity);

const StyledAnimatedView = styled(Animated.View);

export default function LoginScreen({ navigation }: any) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn, signInWithGoogle, resetPassword } = useAuth();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        setLoading(true);
        try {
            await signIn(email, password);
        } catch (error: any) {
            Alert.alert('Login Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!email) {
            Alert.alert('Email Required', 'Please enter your email address first.');
            return;
        }
        try {
            await resetPassword(email);
            Alert.alert('Success', 'Password reset email sent! Check your inbox.');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to send reset email.');
        }
    };

    return (
        <ScreenWrapper className="justify-center px-6">
            <StyledAnimatedView entering={FadeInUp.delay(200).duration(1000).springify()}>
                <StyledText className="text-primary text-5xl font-bold mb-2 text-center tracking-tighter">FlexTrack</StyledText>
                <StyledText className="text-gray-400 text-center mb-12 text-lg">Your AI Workout Companion</StyledText>
            </StyledAnimatedView>

            <StyledView className="space-y-4">
                <StyledAnimatedView entering={FadeInDown.delay(400).duration(1000).springify()}>
                    <StyledInput
                        className="bg-surface/80 text-white p-4 rounded-2xl border border-gray-700 focus:border-primary text-lg"
                        placeholder="Email"
                        placeholderTextColor="#666"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                    />
                </StyledAnimatedView>

                <StyledAnimatedView entering={FadeInDown.delay(600).duration(1000).springify()}>
                    <StyledInput
                        className="bg-surface/80 text-white p-4 rounded-2xl border border-gray-700 focus:border-primary text-lg"
                        placeholder="Password"
                        placeholderTextColor="#666"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                    <StyledButton onPress={handleForgotPassword} className="mt-2">
                        <StyledText className="text-primary text-sm text-right">Forgot Password?</StyledText>
                    </StyledButton>
                </StyledAnimatedView>

                <StyledAnimatedView entering={FadeInDown.delay(800).duration(1000).springify()}>
                    <StyledButton
                        className="bg-primary p-4 rounded-2xl mt-4 shadow-lg shadow-primary/20"
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="black" />
                        ) : (
                            <StyledText className="text-black font-bold text-center text-lg">Sign In</StyledText>
                        )}
                    </StyledButton>
                </StyledAnimatedView>

                <StyledAnimatedView entering={FadeInDown.delay(1000).duration(1000).springify()} className="flex-row items-center my-6">
                    <StyledView className="flex-1 h-[1px] bg-gray-800" />
                    <StyledText className="text-gray-500 mx-4">OR</StyledText>
                    <StyledView className="flex-1 h-[1px] bg-gray-800" />
                </StyledAnimatedView>

                <StyledAnimatedView entering={FadeInDown.delay(1200).duration(1000).springify()}>
                    <StyledButton
                        className="bg-white p-4 rounded-2xl flex-row justify-center items-center shadow-lg"
                        onPress={() => signInWithGoogle()}
                    >
                        <StyledText className="text-black font-bold text-lg">Continue with Google</StyledText>
                    </StyledButton>
                </StyledAnimatedView>

                <StyledAnimatedView entering={FadeInDown.delay(1400).duration(1000).springify()}>
                    <StyledButton onPress={() => navigation.navigate('SignUp')} className="mt-6">
                        <StyledText className="text-gray-400 text-center text-base">
                            Don't have an account? <StyledText className="text-primary font-bold">Sign Up</StyledText>
                        </StyledText>
                    </StyledButton>
                </StyledAnimatedView>
            </StyledView>
        </ScreenWrapper>
    );
}
