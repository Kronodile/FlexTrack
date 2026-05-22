import React from 'react';
import Svg, { Defs, Pattern, Path, Rect } from 'react-native-svg';
import { View, StyleSheet } from 'react-native';

export const GridPattern = () => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern id="grid" width={24} height={24} patternUnits="userSpaceOnUse">
            <Path d="M 24 0 L 0 0 0 24" fill="none" stroke="#000000" strokeWidth={1} strokeOpacity={0.05} />
          </Pattern>
        </Defs>
        <Rect width={10000} height={10000} fill="url(#grid)" />
      </Svg>
    </View>
  );
};
