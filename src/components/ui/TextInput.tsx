import React, { useState } from 'react';
import { TextInput as RNTextInput, TextInputProps, View, Text } from 'react-native';

interface Props extends TextInputProps {
  label?: string;
}

export const TextInput: React.FC<Props> = ({ label, style, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className="w-full mb-6">
      {label && (
        <Text className="font-inter-bold uppercase tracking-widest text-xs mb-2 text-swiss-fg">
          {label}
        </Text>
      )}
      <RNTextInput
        className={`w-full p-4 border-3 text-swiss-fg font-inter-medium text-base bg-swiss-bg ${
          isFocused ? 'border-swiss-accent' : 'border-swiss-fg'
        }`}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        placeholderTextColor="#999999"
        style={style}
        {...props}
      />
    </View>
  );
};
