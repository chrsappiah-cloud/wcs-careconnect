// Copyright (c) 2026 World Class Scholars, led by Dr Christopher Appiah-Thompson. All rights reserved.
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { captureError } from '../services/errorLogger';
import AnimatedPressable from './AnimatedPressable';
import { colors, radius, typography } from '../theme';

/**
 * React error boundary.
 * Catches render-phase exceptions, logs them via errorLogger,
 * and renders a safe fallback instead of a blank crash screen.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <YourScreen />
 *   </ErrorBoundary>
 *
 * Or wrap the entire app in RootLayout.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    captureError(error, {
      source: 'ErrorBoundary',
      componentStack: info?.componentStack,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { fallback } = this.props;
    if (fallback) return fallback;

    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>
            The app encountered an unexpected error. Your data is safe.
          </Text>
          {__DEV__ && this.state.error && (
            <ScrollView style={styles.devBox}>
              <Text style={styles.devText}>
                {this.state.error.message}
                {'\n\n'}
                {this.state.error.stack}
              </Text>
            </ScrollView>
          )}
          <AnimatedPressable
            onPress={this.handleRetry}
            hapticType="medium"
            style={styles.button}
          >
            <Text style={styles.buttonText}>Try again</Text>
          </AnimatedPressable>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 20,
    lineHeight: 22,
  },
  devBox: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    padding: 12,
    maxHeight: 200,
    marginBottom: 20,
  },
  devText: {
    fontSize: 11,
    color: colors.danger,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textInverse,
  },
});
