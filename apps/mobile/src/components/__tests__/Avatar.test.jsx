// Copyright (c) 2026 World Class Scholars, led by Dr Christopher Appiah-Thompson. All rights reserved.
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import Avatar from '../Avatar';

describe('Avatar', () => {
  it('renders initials for a two-word name', () => {
    render(<Avatar name="Jane Doe" />);
    expect(screen.getByText('JD')).toBeTruthy();
  });

  it('renders initials for a single-word name', () => {
    render(<Avatar name="Alice" />);
    expect(screen.getByText('A')).toBeTruthy();
  });

  it('renders "?" when name is empty', () => {
    render(<Avatar name="" />);
    expect(screen.getByText('?')).toBeTruthy();
  });

  it('renders "?" when name is undefined', () => {
    render(<Avatar />);
    expect(screen.getByText('?')).toBeTruthy();
  });

  it('truncates initials to 2 characters for long names', () => {
    render(<Avatar name="Mary Jane Watson" />);
    expect(screen.getByText('MJ')).toBeTruthy();
  });

  it('applies default size of 56', () => {
    const { toJSON } = render(<Avatar name="Test User" />);
    const root = toJSON();
    const flatStyle = Array.isArray(root.props.style)
      ? Object.assign({}, ...root.props.style.filter(Boolean))
      : root.props.style;
    expect(flatStyle.width).toBe(56);
    expect(flatStyle.height).toBe(56);
    expect(flatStyle.borderRadius).toBe(28);
  });

  it('applies custom size', () => {
    const { toJSON } = render(<Avatar name="Test User" size={80} />);
    const root = toJSON();
    const flatStyle = Array.isArray(root.props.style)
      ? Object.assign({}, ...root.props.style.filter(Boolean))
      : root.props.style;
    expect(flatStyle.width).toBe(80);
    expect(flatStyle.height).toBe(80);
    expect(flatStyle.borderRadius).toBe(40);
  });

  it('uses color based on first character code', () => {
    const bgColors = [
      '#DBEAFE',
      '#E0E7FF',
      '#FCE7F3',
      '#D1FAE5',
      '#FEF3C7',
      '#E5E7EB',
      '#F3E8FF',
      '#CFFAFE',
    ];
    const { toJSON: toJSON_A } = render(<Avatar name="Alice" />);
    const root = toJSON_A();
    const flatStyle = Array.isArray(root.props.style)
      ? Object.assign({}, ...root.props.style.filter(Boolean))
      : root.props.style;
    const idx = 'A'.charCodeAt(0) % bgColors.length;
    expect(flatStyle.backgroundColor).toBe(bgColors[idx]);
  });
});
