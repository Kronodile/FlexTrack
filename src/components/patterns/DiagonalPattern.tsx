import React from 'react';
import Svg, { Defs, Pattern, Path, Rect } from 'react-native-svg';
import { View, StyleSheet } from 'react-native';

export const DiagonalPattern = () => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern id="diagonal" width={10} height={10} patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <Path d="M 0 0 L 0 10" stroke="#000000" strokeWidth={1} strokeOpacity={0.05} />
          </Pattern>
        </Defs>
        <Rect width={10000} height={10000} fill="url(#diagonal)" />
      </Svg>
    </View>
  );
};
