// Copyright (c) 2026 World Class Scholars, led by Dr Christopher Appiah-Thompson. All rights reserved.
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { colors, radius, typography } from '../theme';

const STATUS_CONFIG = {
  stable: {
    bg: colors.status.stable.bg,
    text: colors.status.stable.text,
    dot: colors.status.stable.color,
    label: 'Stable',
  },
  warning: {
    bg: colors.status.warning.bg,
    text: colors.status.warning.text,
    dot: colors.status.warning.color,
    label: 'Warning',
  },
  critical: {
    bg: colors.status.critical.bg,
    text: colors.status.critical.text,
    dot: colors.status.critical.color,
    label: 'Critical',
    pulse: true,
  },
};

export default function StatusBadge({ status, size = 'md' }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.stable;
  const isSmall = size === 'sm';
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (config.pulse) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
  }, [config.pulse, pulseAnim]);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: isSmall ? 8 : 10,
        paddingVertical: isSmall ? 3 : 5,
        borderRadius: radius.full,
        backgroundColor: config.bg,
        alignSelf: 'flex-start',
        gap: isSmall ? 4 : 5,
      }}
    >
      <Animated.View
        style={{
          width: isSmall ? 6 : 7,
          height: isSmall ? 6 : 7,
          borderRadius: isSmall ? 3 : 3.5,
          backgroundColor: config.dot,
          opacity: config.pulse ? pulseAnim : 1,
        }}
      />
      <Text
        style={{
          fontSize: isSmall ? 11 : 13,
          fontWeight: '600',
          color: config.text,
          letterSpacing: 0.3,
        }}
      >
        {config.label}
      </Text>
    </View>
  );
}
