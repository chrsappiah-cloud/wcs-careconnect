import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import EmptyState from '../EmptyState';

describe('EmptyState', () => {
  it('renders the title', () => {
    render(<EmptyState title="No Data" />);
    expect(screen.getByText('No Data')).toBeTruthy();
  });

  it('renders subtitle when provided', () => {
    render(<EmptyState title="No Data" subtitle="Try again later" />);
    expect(screen.getByText('Try again later')).toBeTruthy();
  });

  it('does not render subtitle when omitted', () => {
    render(<EmptyState title="No Data" />);
    expect(screen.queryByText('Try again later')).toBeNull();
  });

  it('renders icon when provided', () => {
    render(<EmptyState title="Empty" icon={<Text testID="test-icon">Icon</Text>} />);
    expect(screen.getByTestId('test-icon')).toBeTruthy();
  });

  it('does not render icon wrapper when icon is omitted', () => {
    const { toJSON } = render(<EmptyState title="Empty" />);
    const tree = JSON.stringify(toJSON());
    // The 80px circle should not be in the tree
    expect(tree).not.toContain('"width":80');
  });
});
