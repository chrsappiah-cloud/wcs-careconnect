import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import { colors, radius } from '../theme';

function SkeletonBox({ width, height = 16, borderRadius = radius.sm, style }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius['2xl'],
        padding: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.surfaceBorder,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <SkeletonBox width={56} height={56} borderRadius={28} />
        <View style={{ marginLeft: 16, flex: 1 }}>
          <SkeletonBox width="70%" height={20} style={{ marginBottom: 8 }} />
          <SkeletonBox width="40%" height={14} />
        </View>
      </View>
    </View>
  );
}

export function SkeletonList({ count = 4 }) {
  return (
    <View style={{ paddingTop: 8 }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

export default SkeletonBox;
