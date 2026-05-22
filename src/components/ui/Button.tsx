import React, { useState } from 'react';
import { Pressable, Text, PressableProps, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps extends PressableProps {
  title: string;
  variant?: 'solid' | 'outline';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  title, 
  variant = 'solid', 
  fullWidth = true,
  style, 
  ...props 
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const getContainerStyle = (): ViewStyle => {
    let baseStyle: ViewStyle = {
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderWidth: 3,
      borderColor: '#000000',
      alignItems: 'center',
      justifyContent: 'center',
      width: fullWidth ? '100%' : 'auto',
      backgroundColor: '#000000',
    };

    if (variant === 'outline') {
      baseStyle.backgroundColor = '#FFFFFF';
    }

    if (isPressed) {
      baseStyle.backgroundColor = '#FF3000';
      baseStyle.borderColor = '#FF3000';
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle => {
    let baseStyle: TextStyle = {
      fontFamily: 'Inter_700Bold',
      textTransform: 'uppercase',
      letterSpacing: 2,
      color: '#FFFFFF',
      fontSize: 16,
    };

    if (variant === 'outline' && !isPressed) {
      baseStyle.color = '#000000';
    } else if (isPressed) {
      baseStyle.color = '#FFFFFF';
    }

    return baseStyle;
  };

  return (
    <Pressable
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      style={[getContainerStyle(), style as ViewStyle]}
      {...props}
    >
      <Text style={getTextStyle()}>{title}</Text>
    </Pressable>
  );
};
