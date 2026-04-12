import React from 'react';
import { View, Text } from 'react-native';
import { colors, typography } from '../theme';

export default function EmptyState({ icon, title, subtitle }) {
  return (
    <View
      style={{
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 32,
      }}
    >
      {icon && (
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: colors.surfaceSecondary,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
          }}
        >
          {icon}
        </View>
      )}
      <Text
        style={[typography.title3, { color: colors.text, textAlign: 'center' }]}
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          style={[
            typography.body,
            { color: colors.textTertiary, textAlign: 'center', marginTop: 8 },
          ]}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
}
