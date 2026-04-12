import React from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, radius, shadows } from '../theme';

export default function GlassCard({
  children,
  style,
  intensity = 40,
  tint = 'systemChromeMaterial',
  noPadding,
  borderColor = colors.glass.whiteBorder,
}) {
  if (Platform.OS === 'ios') {
    return (
      <View style={[styles.wrapper, style]}>
        <BlurView
          tint={tint}
          intensity={intensity}
          style={[
            styles.blur,
            !noPadding && styles.padding,
          ]}
        >
          {children}
        </BlurView>
        <View style={[styles.border, { borderColor }]} pointerEvents="none" />
      </View>
    );
  }

  // Android fallback - semi-transparent card
  return (
    <View
      style={[
        styles.wrapper,
        styles.androidFallback,
        !noPadding && styles.padding,
        { borderColor },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  blur: {
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  padding: {
    padding: 16,
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  androidFallback: {
    backgroundColor: colors.glass.white,
    borderWidth: 1,
  },
});
