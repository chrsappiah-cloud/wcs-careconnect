import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent, act } from '@testing-library/react-native';
import AnimatedPressable from '../AnimatedPressable';

// Access mocked Haptics
const Haptics = require('expo-haptics');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AnimatedPressable', () => {
  it('renders children correctly', () => {
    const { getByText } = render(
      <AnimatedPressable onPress={() => {}}>
        <Text>Press Me</Text>
      </AnimatedPressable>,
    );
    expect(getByText('Press Me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <AnimatedPressable onPress={onPress}>
        <Text>Tap</Text>
      </AnimatedPressable>,
    );
    fireEvent.press(getByText('Tap'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('triggers light haptic feedback by default on press', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <AnimatedPressable onPress={onPress}>
        <Text>Haptic</Text>
      </AnimatedPressable>,
    );
    fireEvent.press(getByText('Haptic'));
    // Default hapticType = 'light' triggers Haptics.impactAsync
    expect(Haptics.impactAsync).toHaveBeenCalled();
  });

  it('triggers medium haptic when hapticType="medium"', () => {
    const { getByText } = render(
      <AnimatedPressable onPress={() => {}} hapticType="medium">
        <Text>Medium</Text>
      </AnimatedPressable>,
    );
    fireEvent.press(getByText('Medium'));
    expect(Haptics.impactAsync).toHaveBeenCalled();
  });

  it('triggers success haptic (notification) when hapticType="success"', () => {
    const { getByText } = render(
      <AnimatedPressable onPress={() => {}} hapticType="success">
        <Text>Success</Text>
      </AnimatedPressable>,
    );
    fireEvent.press(getByText('Success'));
    expect(Haptics.notificationAsync).toHaveBeenCalled();
  });

  it('does not trigger haptic when hapticType={null}', () => {
    const { getByText } = render(
      <AnimatedPressable onPress={() => {}} hapticType={null}>
        <Text>Silent</Text>
      </AnimatedPressable>,
    );
    fireEvent.press(getByText('Silent'));
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <AnimatedPressable onPress={onPress} disabled>
        <Text>Disabled</Text>
      </AnimatedPressable>,
    );
    fireEvent.press(getByText('Disabled'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('applies opacity 0.5 when disabled', () => {
    const { toJSON } = render(
      <AnimatedPressable onPress={() => {}} disabled>
        <Text>Faded</Text>
      </AnimatedPressable>,
    );
    // Walk the rendered tree to find a node with opacity 0.5
    const findOpacity = (node) => {
      if (!node) return false;
      const style = node.props?.style;
      if (Array.isArray(style)) {
        const flat = Object.assign({}, ...style.filter(Boolean));
        if (flat.opacity === 0.5) return true;
      } else if (style?.opacity === 0.5) {
        return true;
      }
      if (Array.isArray(node.children)) {
        return node.children.some((c) => typeof c === 'object' && findOpacity(c));
      }
      return false;
    };
    expect(findOpacity(toJSON())).toBe(true);
  });

  it('does not apply disabled opacity when not disabled', () => {
    const { toJSON } = render(
      <AnimatedPressable onPress={() => {}}>
        <Text>Active</Text>
      </AnimatedPressable>,
    );
    const findOpacity = (node) => {
      if (!node) return false;
      const style = node.props?.style;
      if (Array.isArray(style)) {
        const flat = Object.assign({}, ...style.filter(Boolean));
        if (flat.opacity === 0.5) return true;
      } else if (style?.opacity === 0.5) {
        return true;
      }
      if (Array.isArray(node.children)) {
        return node.children.some((c) => typeof c === 'object' && findOpacity(c));
      }
      return false;
    };
    expect(findOpacity(toJSON())).toBe(false);
  });

  it('handles missing onPress gracefully', () => {
    const { getByText } = render(
      <AnimatedPressable>
        <Text>No handler</Text>
      </AnimatedPressable>,
    );
    // Should not throw
    expect(() => fireEvent.press(getByText('No handler'))).not.toThrow();
  });

  it('passes additional props through to Pressable', () => {
    const { getByTestId } = render(
      <AnimatedPressable onPress={() => {}} testID="custom-pressable">
        <Text>Props</Text>
      </AnimatedPressable>,
    );
    expect(getByTestId('custom-pressable')).toBeTruthy();
  });

  it('applies custom style to Animated.View', () => {
    const customStyle = { backgroundColor: 'red', padding: 20 };
    const { toJSON } = render(
      <AnimatedPressable onPress={() => {}} style={customStyle}>
        <Text>Styled</Text>
      </AnimatedPressable>,
    );
    const findStyle = (node) => {
      if (!node) return false;
      const style = node.props?.style;
      if (Array.isArray(style)) {
        const flat = Object.assign({}, ...style.filter(Boolean));
        if (flat.backgroundColor === 'red' && flat.padding === 20) return true;
      } else if (style?.backgroundColor === 'red' && style?.padding === 20) {
        return true;
      }
      if (Array.isArray(node.children)) {
        return node.children.some((c) => typeof c === 'object' && findStyle(c));
      }
      return false;
    };
    expect(findStyle(toJSON())).toBe(true);
  });

  it('handles pressIn and pressOut events without crash', () => {
    const { getByTestId } = render(
      <AnimatedPressable onPress={() => {}} testID="press-events">
        <Text>Events</Text>
      </AnimatedPressable>,
    );
    const pressable = getByTestId('press-events');
    expect(() => {
      fireEvent(pressable, 'pressIn');
      fireEvent(pressable, 'pressOut');
    }).not.toThrow();
  });
});
