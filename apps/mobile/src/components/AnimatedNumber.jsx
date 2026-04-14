// Copyright (c) 2026 World Class Scholars, led by Dr Christopher Appiah-Thompson. All rights reserved.
import React, { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';

export default function AnimatedNumber({
  value = 0,
  duration = 800,
  style,
  prefix = '',
  suffix = '',
  decimals = 0,
}) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const listener = animatedValue.addListener(({ value: v }) => {
      setDisplayValue(v);
    });

    Animated.timing(animatedValue, {
      toValue: value,
      duration,
      useNativeDriver: false,
    }).start();

    return () => animatedValue.removeListener(listener);
  }, [value, duration, prefix, suffix, decimals]);

  return (
    <Animated.Text style={style}>
      {`${prefix}${displayValue.toFixed(decimals)}${suffix}`}
    </Animated.Text>
  );
}
