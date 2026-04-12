import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { colors, typography, shadows } from '../theme';

export default function EmptyState({ icon, title, subtitle }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 15,
        stiffness: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <Animated.View
      style={{
        alignItems: 'center',
        paddingVertical: 72,
        paddingHorizontal: 40,
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      {icon && (
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            backgroundColor: colors.surfaceSecondary,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
            ...shadows.sm,
          }}
        >
          {icon}
        </View>
      )}
      <Text
        style={[
          typography.title3,
          { color: colors.text, textAlign: 'center', marginBottom: 8 },
        ]}
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          style={[
            typography.callout,
            {
              color: colors.textTertiary,
              textAlign: 'center',
              lineHeight: 22,
              maxWidth: 280,
            },
          ]}
        >
          {subtitle}
        </Text>
      )}
    </Animated.View>
  );
}
