// Copyright (c) 2026 World Class Scholars, led by Dr Christopher Appiah-Thompson. All rights reserved.
import React, { useRef, useCallback } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { animation } from '../theme';
import { haptic } from '../utils/haptics';

const THROTTLE_MS = 250;

function AnimatedPressable({
  children,
  onPress,
  style,
  scaleValue = animation.pressScale,
  hapticType = 'light',
  disabled,
  ...props
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const lastPress = useRef(0);

  const onPressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: scaleValue,
      useNativeDriver: true,
      ...animation.spring,
    }).start();
  }, [scale, scaleValue]);

  const onPressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      ...animation.springBouncy,
    }).start();
  }, [scale]);

  const handlePress = useCallback(() => {
    const now = Date.now();
    if (now - lastPress.current < THROTTLE_MS) return;
    lastPress.current = now;
    if (hapticType && haptic[hapticType]) haptic[hapticType]();
    onPress?.();
  }, [onPress, hapticType]);

  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={handlePress}
      disabled={disabled}
      {...props}
    >
      <Animated.View
        style={[
          style,
          { transform: [{ scale }] },
          disabled && styles.disabled,
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

export default React.memo(AnimatedPressable);

const styles = StyleSheet.create({
  disabled: { opacity: 0.5 },
});
