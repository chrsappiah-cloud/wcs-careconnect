// Copyright (c) 2026 World Class Scholars, led by Dr Christopher Appiah-Thompson. All rights reserved.
export * from 'expo-font';
export { useFonts } from 'expo-font';

export async function renderToImageAsync(): Promise<{
  uri: string;
  width: number;
  height: number;
}> {
  return { uri: '', width: 0, height: 0 };
}
