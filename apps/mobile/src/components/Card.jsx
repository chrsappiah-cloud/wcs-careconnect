import React from 'react';
import { View } from 'react-native';
import { colors, radius, shadows } from '../theme';

export default function Card({
  children,
  style,
  variant = 'default',
  noPadding,
}) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius['2xl'],
          borderWidth: 1,
          borderColor: colors.surfaceBorder,
          ...shadows.sm,
        },
        !noPadding && { padding: 20 },
        variant === 'elevated' && shadows.md,
        style,
      ]}
    >
      {children}
    </View>
  );
}
