import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import WorkoutInputScreen from '../screens/WorkoutInputScreen';
import WorkoutDisplayScreen from '../screens/WorkoutDisplayScreen';
import WorkoutLoggingScreen from '../screens/WorkoutLoggingScreen';
import ProgressScreen from '../screens/ProgressScreen';
import { useAuth } from '../context/AuthContext';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    const { user, loading } = useAuth();

    if (loading) return null;

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade_from_bottom', animationDuration: 150 }}>
                {user ? (
                    <>
                        <Stack.Screen name="Home" component={WorkoutInputScreen} />
                        <Stack.Screen name="WorkoutDisplay" component={WorkoutDisplayScreen} />
                        <Stack.Screen name="WorkoutLogging" component={WorkoutLoggingScreen} />
                        <Stack.Screen name="Progress" component={ProgressScreen} />
                    </>
                ) : (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="SignUp" component={SignUpScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
