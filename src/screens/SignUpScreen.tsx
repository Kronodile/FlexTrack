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

export default function SignUpScreen({ navigation }: any) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { signUp } = useAuth();

    const handleSignUp = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        setLoading(true);
        try {
            await signUp(email, password);
            Alert.alert('Success', 'Account created successfully!');
        } catch (error: any) {
            Alert.alert('Sign Up Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScreenWrapper className="justify-center px-6">
            <StyledAnimatedView entering={FadeInUp.delay(200).duration(1000).springify()}>
                <StyledText className="text-primary text-4xl font-bold mb-2 text-center tracking-tighter">Join FlexTrack</StyledText>
                <StyledText className="text-gray-400 text-center mb-12 text-lg">Start your journey today</StyledText>
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
                </StyledAnimatedView>

                <StyledAnimatedView entering={FadeInDown.delay(800).duration(1000).springify()}>
                    <StyledButton
                        className="bg-primary p-4 rounded-2xl mt-4 shadow-lg shadow-primary/20"
                        onPress={handleSignUp}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="black" />
                        ) : (
                            <StyledText className="text-black font-bold text-center text-lg">Sign Up</StyledText>
                        )}
                    </StyledButton>
                </StyledAnimatedView>

                <StyledAnimatedView entering={FadeInDown.delay(1000).duration(1000).springify()}>
                    <StyledButton onPress={() => navigation.navigate('Login')} className="mt-6">
                        <StyledText className="text-gray-400 text-center text-base">
                            Already have an account? <StyledText className="text-primary font-bold">Login</StyledText>
                        </StyledText>
                    </StyledButton>
                </StyledAnimatedView>
            </StyledView>
        </ScreenWrapper>
    );
}
