import React from 'react';
import { View, Text } from 'react-native';
import { colors, typography } from '../theme';

export default function SectionHeader({ title, subtitle, right }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        paddingHorizontal: 20,
      }}
    >
      <View>
        <Text style={[typography.title2, { color: colors.text }]}>{title}</Text>
        {subtitle && (
          <Text style={[typography.callout, { color: colors.textTertiary, marginTop: 2 }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {right}
    </View>
  );
}
