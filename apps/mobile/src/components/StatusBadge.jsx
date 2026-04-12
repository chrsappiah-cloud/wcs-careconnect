import React from 'react';
import { View, Text } from 'react-native';
import { colors, radius, typography } from '../theme';

const STATUS_CONFIG = {
  stable: {
    bg: colors.status.stable.bg,
    text: colors.status.stable.text,
    label: 'Stable',
  },
  warning: {
    bg: colors.status.warning.bg,
    text: colors.status.warning.text,
    label: 'Warning',
  },
  critical: {
    bg: colors.status.critical.bg,
    text: colors.status.critical.text,
    label: 'Critical',
  },
};

export default function StatusBadge({ status, size = 'md' }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.stable;
  const isSmall = size === 'sm';

  return (
    <View
      style={{
        paddingHorizontal: isSmall ? 8 : 12,
        paddingVertical: isSmall ? 2 : 4,
        borderRadius: radius.sm,
        backgroundColor: config.bg,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        style={{
          fontSize: isSmall ? 12 : 14,
          fontWeight: '600',
          color: config.text,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {config.label}
      </Text>
    </View>
  );
}
