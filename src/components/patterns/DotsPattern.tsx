import React from 'react';
import Svg, { Defs, Pattern, Circle, Rect } from 'react-native-svg';
import { View, StyleSheet } from 'react-native';

export const DotsPattern = () => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern id="dots" width={16} height={16} patternUnits="userSpaceOnUse">
            <Circle cx={2} cy={2} r={1.5} fill="#000000" fillOpacity={0.08} />
          </Pattern>
        </Defs>
        <Rect width={10000} height={10000} fill="url(#dots)" />
      </Svg>
    </View>
  );
};
