import React, { useState } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import ScreenWrapper from '../components/ScreenWrapper';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import FlexTrackLogo from '../components/FlexTrackLogo';
import { Button } from '../components/ui/Button';
import { TextInput } from '../components/ui/TextInput';
import { Typography } from '../components/ui/Typography';
import { GridPattern } from '../components/patterns/GridPattern';

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
        <ScreenWrapper className="justify-center px-6 bg-swiss-bg">
            <GridPattern />
            
            <Animated.View entering={FadeInUp.delay(200).duration(1000)} className="mb-12">
                <FlexTrackLogo size={48} />
                <Typography variant="body" className="mt-4 text-swiss-fg">
                    THE OBJECTIVE WORKOUT COMPANION
                </Typography>
            </Animated.View>

            <View className="space-y-4">
                <Animated.View entering={FadeInDown.delay(400).duration(1000)}>
                    <TextInput
                        label="Email Address"
                        placeholder="NAME@EXAMPLE.COM"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                    />
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(600).duration(1000)}>
                    <TextInput
                        label="Password"
                        placeholder="ENTER PASSWORD"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(700).duration(1000)}>
                    <Button 
                        title={loading ? "LOADING..." : "SIGN IN"} 
                        onPress={handleLogin}
                        disabled={loading}
                        className="mt-4"
                    />
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(800).duration(1000)}>
                    <Button 
                        title="FORGOT PASSWORD"
                        variant="outline"
                        onPress={handleForgotPassword}
                        className="mt-2"
                    />
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(1000).duration(1000)} className="flex-row items-center my-6">
                    <View className="flex-1 h-[3px] bg-swiss-fg" />
                    <Typography variant="label" className="mx-4">OR</Typography>
                    <View className="flex-1 h-[3px] bg-swiss-fg" />
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(1200).duration(1000)}>
                    <Button 
                        title="CONTINUE WITH GOOGLE" 
                        variant="outline"
                        onPress={() => signInWithGoogle()} 
                    />
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(1400).duration(1000)}>
                    <Button 
                        title="CREATE ACCOUNT" 
                        variant="outline"
                        onPress={() => navigation.navigate('SignUp')}
                        className="mt-6 border-transparent bg-transparent"
                    />
                </Animated.View>
            </View>
        </ScreenWrapper>
    );
}
