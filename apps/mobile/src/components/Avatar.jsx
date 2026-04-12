import React from 'react';
import { View, Text } from 'react-native';
import { colors, radius, shadows } from '../theme';

const AVATAR_PALETTES = [
  { bg: '#DBEAFE', text: '#1E40AF' },
  { bg: '#E0E7FF', text: '#3730A3' },
  { bg: '#FCE7F3', text: '#BE185D' },
  { bg: '#D1FAE5', text: '#065F46' },
  { bg: '#FEF3C7', text: '#92400E' },
  { bg: '#E5E7EB', text: '#374151' },
  { bg: '#F3E8FF', text: '#6B21A8' },
  { bg: '#CFFAFE', text: '#155E75' },
];

export default function Avatar({ name, size = 56, uri, showRing, ringColor }) {
  const initials = name
    ? name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?';

  if (uri) {
    try {
      const { Image } = require('expo-image');
      return (
        <View style={showRing ? {
          width: size + 6,
          height: size + 6,
          borderRadius: (size + 6) / 2,
          borderWidth: 2.5,
          borderColor: ringColor || colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        } : undefined}>
          <Image
            source={{ uri }}
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
            }}
            contentFit="cover"
          />
        </View>
      );
    } catch {
      // fallback below
    }
  }

  const index = name ? name.charCodeAt(0) % AVATAR_PALETTES.length : 0;
  const palette = AVATAR_PALETTES[index];

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: palette.bg,
          alignItems: 'center',
          justifyContent: 'center',
        },
        showRing && {
          borderWidth: 2.5,
          borderColor: ringColor || colors.primary,
        },
      ]}
    >
      <Text
        style={{
          fontSize: size * 0.36,
          fontWeight: '700',
          color: palette.text,
          letterSpacing: -0.5,
        }}
      >
        {initials}
      </Text>
    </View>
  );
}
