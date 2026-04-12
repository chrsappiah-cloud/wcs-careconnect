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
          borderRadius: radius.xl,
          overflow: 'hidden',
        },
        variant === 'default' && {
          borderWidth: 1,
          borderColor: colors.surfaceBorder,
          ...shadows.sm,
        },
        variant === 'elevated' && {
          ...shadows.lg,
        },
        variant === 'flat' && {
          backgroundColor: colors.surfaceSecondary,
        },
        !noPadding && { padding: 16 },
        style,
      ]}
    >
      {children}
    </View>
  );
}
