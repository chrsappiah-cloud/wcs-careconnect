// Copyright (c) 2026 World Class Scholars, led by Dr Christopher Appiah-Thompson. All rights reserved.
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import StatusBadge from '../StatusBadge';
import { colors, radius } from '../../theme';

describe('StatusBadge', () => {
  it('renders "STABLE" for stable status', () => {
    render(<StatusBadge status="stable" />);
    expect(screen.getByText('Stable')).toBeTruthy();
  });

  it('renders "WARNING" for warning status', () => {
    render(<StatusBadge status="warning" />);
    expect(screen.getByText('Warning')).toBeTruthy();
  });

  it('renders "CRITICAL" for critical status', () => {
    render(<StatusBadge status="critical" />);
    expect(screen.getByText('Critical')).toBeTruthy();
  });

  it('defaults to "Stable" for unknown status', () => {
    render(<StatusBadge status="unknown" />);
    expect(screen.getByText('Stable')).toBeTruthy();
  });

  it('applies correct bg color for each status', () => {
    const { toJSON } = render(<StatusBadge status="critical" />);
    const root = toJSON();
    expect(root.props.style.backgroundColor).toBe(colors.status.critical.bg);
  });

  it('renders small size with smaller padding and font', () => {
    const { toJSON } = render(<StatusBadge status="stable" size="sm" />);
    const root = toJSON();
    expect(root.props.style.paddingHorizontal).toBe(8);
    expect(root.props.style.paddingVertical).toBe(3);
    const textNode = root.children.find(c => c.type === 'Text');
    expect(textNode.props.style.fontSize).toBe(11);
  });

  it('renders md size (default) with larger padding and font', () => {
    const { toJSON } = render(<StatusBadge status="warning" />);
    const root = toJSON();
    expect(root.props.style.paddingHorizontal).toBe(10);
    expect(root.props.style.paddingVertical).toBe(5);
    const textNode = root.children.find(c => c.type === 'Text');
    expect(textNode.props.style.fontSize).toBe(13);
  });
});
