import React, { useState } from 'react';
import { View, ViewProps, Pressable, PressableProps } from 'react-native';

interface CardProps extends Omit<PressableProps, 'children'> {
  children?: React.ReactNode;
  interactive?: boolean;
  accentOnHover?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  style, 
  interactive,
  onPress,
  onLongPress,
  accentOnHover,
  ...props 
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const Container = interactive || onPress || onLongPress ? Pressable : View;
  
  const interactionProps = (interactive || onPress || onLongPress) ? {
    onPressIn: () => setIsPressed(true),
    onPressOut: () => setIsPressed(false),
    onPress,
    onLongPress
  } : {};

  return (
    <Container
      className={`border-3 border-swiss-fg p-6 sm:p-8 ${
        isPressed && accentOnHover ? 'bg-swiss-accent' : 'bg-swiss-bg'
      }`}
      style={style}
      {...interactionProps}
      {...props}
    >
      {children}
    </Container>
  );
};
