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
    expect(root.props.style.width).toBe(56);
    expect(root.props.style.height).toBe(56);
    expect(root.props.style.borderRadius).toBe(28);
  });

  it('applies custom size', () => {
    const { toJSON } = render(<Avatar name="Test User" size={80} />);
    const root = toJSON();
    expect(root.props.style.width).toBe(80);
    expect(root.props.style.height).toBe(80);
    expect(root.props.style.borderRadius).toBe(40);
  });

  it('uses color based on first character code', () => {
    const bgColors = [
      '#DBEAFE',
      '#E0E7FF',
      '#FCE7F3',
      '#D1FAE5',
      '#FEF3C7',
      '#E5E7EB',
    ];
    const { toJSON: toJSON_A } = render(<Avatar name="Alice" />);
    const idx = 'A'.charCodeAt(0) % bgColors.length;
    expect(toJSON_A().props.style.backgroundColor).toBe(bgColors[idx]);
  });
});
