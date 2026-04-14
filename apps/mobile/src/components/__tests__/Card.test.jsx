import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import Card from '../Card';
import { colors, radius, shadows } from '../../theme';

describe('Card', () => {
  it('renders children', () => {
    render(
      <Card>
        <Text>Hello</Text>
      </Card>,
    );
    expect(screen.getByText('Hello')).toBeTruthy();
  });

  it('applies default padding of 16', () => {
    const { toJSON } = render(
      <Card>
        <Text>Padded</Text>
      </Card>,
    );
    const root = toJSON();
    const flatStyle = Object.assign({}, ...root.props.style.filter(Boolean));
    expect(flatStyle.padding).toBe(16);
  });

  it('removes padding when noPadding is true', () => {
    const { toJSON } = render(
      <Card noPadding>
        <Text>NP</Text>
      </Card>,
    );
    const root = toJSON();
    const styles = root.props.style.filter(Boolean);
    const flatStyle = Object.assign({}, ...styles);
    expect(flatStyle.padding).toBeUndefined();
  });

  it('applies elevated variant shadow', () => {
    const { toJSON } = render(
      <Card variant="elevated">
        <Text>Elevated</Text>
      </Card>,
    );
    const root = toJSON();
    const flatStyle = Object.assign({}, ...root.props.style.filter(Boolean));
    expect(flatStyle.shadowRadius).toBe(shadows.lg.shadowRadius);
  });

  it('applies custom style', () => {
    const { toJSON } = render(
      <Card style={{ marginTop: 99 }}>
        <Text>Custom</Text>
      </Card>,
    );
    const root = toJSON();
    const flatStyle = Object.assign({}, ...root.props.style.filter(Boolean));
    expect(flatStyle.marginTop).toBe(99);
  });

  it('uses surface background and correct border radius', () => {
    const { toJSON } = render(
      <Card>
        <Text>BG</Text>
      </Card>,
    );
    const root = toJSON();
    const base = root.props.style[0];
    expect(base.backgroundColor).toBe(colors.surface);
    expect(base.borderRadius).toBe(radius.xl);
  });
});
