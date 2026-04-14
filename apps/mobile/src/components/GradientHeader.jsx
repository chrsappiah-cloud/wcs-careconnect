// Copyright (c) 2026 World Class Scholars, led by Dr Christopher Appiah-Thompson. All rights reserved.
import React from 'react';
import { View, Text, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, gradients } from '../theme';

export default function GradientHeader({
  title,
  subtitle,
  rightContent,
  children,
  gradient = gradients.header,
}) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        paddingTop: insets.top + 8,
        paddingHorizontal: 20,
        paddingBottom: 20,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: subtitle || children ? 4 : 0,
        }}
      >
        <Text
          style={[
            typography.largeTitle,
            { color: colors.textInverse },
          ]}
        >
          {title}
        </Text>
        {rightContent}
      </View>
      {subtitle && (
        <Text
          style={[
            typography.callout,
            { color: 'rgba(255,255,255,0.8)', marginTop: 2 },
          ]}
        >
          {subtitle}
        </Text>
      )}
      {children}
    </LinearGradient>
  );
}
