import React, { useState } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import ScreenWrapper from '../components/ScreenWrapper';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Button } from '../components/ui/Button';
import { TextInput } from '../components/ui/TextInput';
import { Typography } from '../components/ui/Typography';
import { DotsPattern } from '../components/patterns/DotsPattern';

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
        <ScreenWrapper className="justify-center px-6 bg-swiss-bg">
            <DotsPattern />
            
            <Animated.View entering={FadeInUp.delay(200).duration(1000)} className="mb-12">
                <Typography variant="h1" className="text-swiss-accent">JOIN</Typography>
                <Typography variant="h1" className="text-swiss-fg">THE SYSTEM</Typography>
                <Typography variant="body" className="mt-4">
                    BEGIN YOUR OBJECTIVE FITNESS JOURNEY.
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

                <Animated.View entering={FadeInDown.delay(800).duration(1000)}>
                    <Button 
                        title={loading ? "LOADING..." : "REGISTER"} 
                        onPress={handleSignUp}
                        disabled={loading}
                        className="mt-4"
                    />
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(1000).duration(1000)}>
                    <Button 
                        title="BACK TO LOGIN" 
                        variant="outline"
                        onPress={() => navigation.navigate('Login')}
                        className="mt-6 border-transparent bg-transparent"
                    />
                </Animated.View>
            </View>
        </ScreenWrapper>
    );
}
