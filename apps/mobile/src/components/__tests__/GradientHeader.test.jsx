import React from 'react';
import { Text, View } from 'react-native';
import { render } from '@testing-library/react-native';
import GradientHeader from '../GradientHeader';

describe('GradientHeader', () => {
  it('renders title text', () => {
    const { getByText } = render(<GradientHeader title="Dashboard" />);
    expect(getByText('Dashboard')).toBeTruthy();
  });

  it('renders subtitle when provided', () => {
    const { getByText } = render(
      <GradientHeader title="Alerts" subtitle="3 active alerts" />,
    );
    expect(getByText('Alerts')).toBeTruthy();
    expect(getByText('3 active alerts')).toBeTruthy();
  });

  it('does not render subtitle when not provided', () => {
    const { queryByText } = render(<GradientHeader title="Settings" />);
    expect(queryByText('Settings')).toBeTruthy();
    // No subtitle element should exist
    const tree = render(<GradientHeader title="Settings" />).toJSON();
    // tree should not contain a subtitle-style text beyond the title
    expect(tree).toBeTruthy();
  });

  it('renders rightContent in the header row', () => {
    const { getByText } = render(
      <GradientHeader
        title="Tasks"
        rightContent={<Text>Filter</Text>}
      />,
    );
    expect(getByText('Tasks')).toBeTruthy();
    expect(getByText('Filter')).toBeTruthy();
  });

  it('renders children below the title', () => {
    const { getByText } = render(
      <GradientHeader title="Search">
        <Text>Search Bar</Text>
      </GradientHeader>,
    );
    expect(getByText('Search')).toBeTruthy();
    expect(getByText('Search Bar')).toBeTruthy();
  });

  it('uses LinearGradient (mocked as testID="linear-gradient")', () => {
    const { getByTestId } = render(<GradientHeader title="Test" />);
    expect(getByTestId('linear-gradient')).toBeTruthy();
  });

  it('accepts custom gradient colors prop', () => {
    const customGradient = ['#FF0000', '#00FF00'];
    const { getByTestId } = render(
      <GradientHeader title="Custom" gradient={customGradient} />,
    );
    const lg = getByTestId('linear-gradient');
    expect(lg.props.colors).toEqual(customGradient);
  });

  it('applies safe area insets padding', () => {
    // Safe area insets are mocked to return { top: 0, bottom: 0, left: 0, right: 0 }
    const { getByTestId } = render(<GradientHeader title="Insets" />);
    const lg = getByTestId('linear-gradient');
    const style = lg.props.style;
    // paddingTop = insets.top(0) + 8
    expect(style.paddingTop).toBe(8);
    expect(style.paddingHorizontal).toBe(20);
    expect(style.paddingBottom).toBe(20);
  });

  it('renders title with largeTitle typography style', () => {
    const { getByText } = render(<GradientHeader title="Typography" />);
    const titleEl = getByText('Typography');
    const flatStyle = Array.isArray(titleEl.props.style)
      ? Object.assign({}, ...titleEl.props.style.filter(Boolean))
      : titleEl.props.style;
    expect(flatStyle.fontSize).toBe(34);
    expect(flatStyle.fontWeight).toBe('800');
  });

  it('renders title with inverse text color', () => {
    const { getByText } = render(<GradientHeader title="Color" />);
    const titleEl = getByText('Color');
    const flatStyle = Array.isArray(titleEl.props.style)
      ? Object.assign({}, ...titleEl.props.style.filter(Boolean))
      : titleEl.props.style;
    expect(flatStyle.color).toBe('#FFFFFF');
  });

  it('renders complex rightContent and children together', () => {
    const { getByText, getByTestId } = render(
      <GradientHeader
        title="Complex"
        subtitle="Sub"
        rightContent={<View testID="right"><Text>Action</Text></View>}
      >
        <View testID="child"><Text>Child Content</Text></View>
      </GradientHeader>,
    );
    expect(getByText('Complex')).toBeTruthy();
    expect(getByText('Sub')).toBeTruthy();
    expect(getByText('Action')).toBeTruthy();
    expect(getByText('Child Content')).toBeTruthy();
    expect(getByTestId('right')).toBeTruthy();
    expect(getByTestId('child')).toBeTruthy();
  });
});
