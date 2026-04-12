import React, { useRef, useCallback } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { animation } from '../theme';
import { haptic } from '../utils/haptics';

export default function AnimatedPressable({
  children,
  onPress,
  style,
  scaleValue = animation.pressScale,
  hapticType = 'light',
  disabled,
  ...props
}) {
  const scale = useRef(new Animated.Value(1)).current;

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

const styles = StyleSheet.create({
  disabled: { opacity: 0.5 },
});
