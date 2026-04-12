import React, { useEffect, useRef } from 'react';
import { Text, Animated } from 'react-native';

export default function AnimatedNumber({
  value = 0,
  duration = 800,
  style,
  prefix = '',
  suffix = '',
  decimals = 0,
}) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const displayValue = useRef(0);
  const textRef = useRef(null);

  useEffect(() => {
    const listener = animatedValue.addListener(({ value: v }) => {
      displayValue.current = v;
      if (textRef.current) {
        textRef.current.setNativeProps({
          text: `${prefix}${v.toFixed(decimals)}${suffix}`,
        });
      }
    });

    Animated.timing(animatedValue, {
      toValue: value,
      duration,
      useNativeDriver: false,
    }).start();

    return () => animatedValue.removeListener(listener);
  }, [value, duration, prefix, suffix, decimals]);

  return (
    <Animated.Text ref={textRef} style={style}>
      {`${prefix}${value.toFixed(decimals)}${suffix}`}
    </Animated.Text>
  );
}
