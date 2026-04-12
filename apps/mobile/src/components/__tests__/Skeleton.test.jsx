import React from 'react';
import { render } from '@testing-library/react-native';
import SkeletonBox, { SkeletonCard, SkeletonList } from '../Skeleton';

describe('SkeletonBox', () => {
  it('renders with default height', () => {
    const { toJSON } = render(<SkeletonBox width={100} />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders with custom dimensions', () => {
    const { toJSON } = render(<SkeletonBox width={200} height={40} borderRadius={12} />);
    expect(toJSON()).toBeTruthy();
  });
});

describe('SkeletonCard', () => {
  it('renders successfully', () => {
    const { toJSON } = render(<SkeletonCard />);
    expect(toJSON()).toBeTruthy();
  });
});

describe('SkeletonList', () => {
  it('renders default 4 cards', () => {
    const { toJSON } = render(<SkeletonList />);
    const tree = toJSON();
    // SkeletonList wraps cards in a View; children should have 4 items
    expect(tree.children).toHaveLength(4);
  });

  it('renders custom count', () => {
    const { toJSON } = render(<SkeletonList count={2} />);
    const tree = toJSON();
    expect(tree.children).toHaveLength(2);
  });

  it('renders zero count', () => {
    const { toJSON } = render(<SkeletonList count={0} />);
    const tree = toJSON();
    expect(tree.children).toBeNull();
  });
});
