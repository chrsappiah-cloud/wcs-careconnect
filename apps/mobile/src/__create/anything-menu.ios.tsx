// Copyright (c) 2026 World Class Scholars, led by Dr Christopher Appiah-Thompson. All rights reserved.
import React from "react";
import { View, StyleSheet } from "react-native";
import LauncherMenuContainer from "@anythingai/app/screens/launcher-menu";
const isExpoGo = globalThis.expo?.modules?.ExpoGo

export default () => {
  if (isExpoGo) {
    return null;
  }
  return (
    <View style={{ ...StyleSheet.absoluteFillObject, zIndex: 9999 }} pointerEvents="box-none">
      <LauncherMenuContainer />
    </View>

  )
}
