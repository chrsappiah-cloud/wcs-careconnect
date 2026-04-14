// Copyright (c) 2026 World Class Scholars, led by Dr Christopher Appiah-Thompson. All rights reserved.
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import SectionHeader from '../SectionHeader';

describe('SectionHeader', () => {
  it('renders the title', () => {
    render(<SectionHeader title="Residents" />);
    expect(screen.getByText('Residents')).toBeTruthy();
  });

  it('renders subtitle when provided', () => {
    render(<SectionHeader title="Residents" subtitle="12 total" />);
    expect(screen.getByText('12 total')).toBeTruthy();
  });

  it('does not render subtitle when omitted', () => {
    render(<SectionHeader title="Residents" />);
    expect(screen.queryByText('12 total')).toBeNull();
  });

  it('renders right slot element', () => {
    render(
      <SectionHeader
        title="Alerts"
        right={<Text testID="right-btn">View All</Text>}
      />,
    );
    expect(screen.getByTestId('right-btn')).toBeTruthy();
    expect(screen.getByText('View All')).toBeTruthy();
  });

  it('renders without right slot', () => {
    const { toJSON } = render(<SectionHeader title="Tasks" />);
    expect(toJSON()).toBeTruthy();
  });
});
