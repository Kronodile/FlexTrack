import React from 'react';
import { Text, TextProps } from 'react-native';

interface TypographyProps extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'label' | 'number';
}

export const Typography: React.FC<TypographyProps> = ({ variant = 'body', className = '', children, ...props }) => {
  let baseClass = '';

  switch (variant) {
    case 'h1':
      baseClass = 'font-inter-black text-5xl sm:text-7xl uppercase tracking-tighter text-swiss-fg';
      break;
    case 'h2':
      baseClass = 'font-inter-black text-3xl sm:text-5xl uppercase tracking-tighter text-swiss-fg';
      break;
    case 'h3':
      baseClass = 'font-inter-bold text-xl uppercase tracking-widest text-swiss-fg';
      break;
    case 'body':
      baseClass = 'font-inter text-base text-swiss-fg';
      break;
    case 'label':
      baseClass = 'font-inter-bold text-xs uppercase tracking-widest text-swiss-fg';
      break;
    case 'number':
      baseClass = 'font-inter-black text-swiss-accent text-lg mr-2 uppercase tracking-widest';
      break;
  }

  return (
    <Text className={`${baseClass} ${className}`} {...props}>
      {children}
    </Text>
  );
};
