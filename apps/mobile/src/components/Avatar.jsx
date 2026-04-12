import React from 'react';
import { View, Text } from 'react-native';
import { User } from 'lucide-react-native';
import { colors, radius } from '../theme';

export default function Avatar({ name, size = 56, uri }) {
  const initials = name
    ? name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?';

  if (uri) {
    // expo-image import is optional — fallback to initials if not available
    try {
      const { Image } = require('expo-image');
      return (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          contentFit="cover"
        />
      );
    } catch {
      // fallback below
    }
  }

  const bgColors = [
    '#DBEAFE',
    '#E0E7FF',
    '#FCE7F3',
    '#D1FAE5',
    '#FEF3C7',
    '#E5E7EB',
  ];
  const textColors = [
    '#1E40AF',
    '#3730A3',
    '#BE185D',
    '#065F46',
    '#92400E',
    '#374151',
  ];
  const index = name ? name.charCodeAt(0) % bgColors.length : 0;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bgColors[index],
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontSize: size * 0.38,
          fontWeight: '700',
          color: textColors[index],
        }}
      >
        {initials}
      </Text>
    </View>
  );
}
