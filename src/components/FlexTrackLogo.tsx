import React from "react";
import { View } from "react-native";
import { Typography } from "./ui/Typography";

export default function FlexTrackLogo({
  size = 48
}) {
  return (
    <View className="border-4 border-swiss-fg p-4 self-start bg-swiss-bg">
      <Typography variant="h1" className="text-swiss-accent text-center tracking-tighter" style={{ fontSize: size }}>
        FLEX
      </Typography>
      <Typography variant="h1" className="text-swiss-fg text-center tracking-tighter" style={{ fontSize: size }}>
        TRACK
      </Typography>
    </View>
  );
}
