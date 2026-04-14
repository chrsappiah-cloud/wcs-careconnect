// Copyright (c) 2026 World Class Scholars, led by Dr Christopher Appiah-Thompson. All rights reserved.
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  Alert,
  Linking,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  User,
  Bell,
  BellOff,
  Shield,
  Lock,
  HelpCircle,
  Headphones,
  LogOut,
  ChevronRight,
  Stethoscope,
  Cloud,
  CloudOff,
  RefreshCw,
  Download,
  Volume2,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, typography, shadows, gradients } from '../../theme';
import { useAuth } from '../../utils/auth/useAuth';
import Avatar from '../../components/Avatar';
import Card from '../../components/Card';
import AnimatedPressable from '../../components/AnimatedPressable';
import { haptic } from '../../utils/haptics';
import { useRouter } from 'expo-router';
import { useBackupManager } from '../../hooks/useBackupManager';
import { restoreToServer, clearBackup } from '../../services/iCloudBackup';
import { isOnline } from '../../services/syncManager';
import {
  registerForPushNotifications,
  unregisterPushNotifications,
} from '../../services/pushNotifications';
import { isAudioEnabled, setAudioEnabled } from '../../services/soundService';

const SETTINGS_KEY = '@careconnect_settings';
const TIMEOUT_OPTIONS = ['5 mins', '10 mins', '15 mins', '20 mins', '30 mins'];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { signOut, auth } = useAuth();
  const router = useRouter();
  const [pushAlerts, setPushAlerts] = useState(true);
  const [highPriorityOnly, setHighPriorityOnly] = useState(false);
  const [soundEffects, setSoundEffects] = useState(isAudioEnabled());
  const [biometricUnlock, setBiometricUnlock] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState('20 mins');

  // Load persisted settings
  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_KEY).then((raw) => {
      if (raw) {
        try {
          const saved = JSON.parse(raw);
          if (saved.pushAlerts != null) setPushAlerts(saved.pushAlerts);
          if (saved.highPriorityOnly != null)
            setHighPriorityOnly(saved.highPriorityOnly);
          if (saved.soundEffects != null) {
            setSoundEffects(saved.soundEffects);
            setAudioEnabled(saved.soundEffects);
          }
          if (saved.biometricUnlock != null)
            setBiometricUnlock(saved.biometricUnlock);
          if (saved.sessionTimeout) setSessionTimeout(saved.sessionTimeout);
        } catch {}
      }
    });
  }, []);

  const persistSettings = useCallback((updates) => {
    AsyncStorage.getItem(SETTINGS_KEY).then((raw) => {
      const current = raw ? JSON.parse(raw) : {};
      AsyncStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({ ...current, ...updates }),
      );
    });
  }, []);

  const handleSignOut = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  }, [signOut]);

  const handleSessionTimeout = useCallback(() => {
    Alert.alert(
      'Session Timeout',
      'Select auto-lock duration:',
      TIMEOUT_OPTIONS.map((opt) => ({
        text: opt,
        onPress: () => {
          setSessionTimeout(opt);
          persistSettings({ sessionTimeout: opt });
        },
      })),
    );
  }, [persistSettings]);

  const userName = auth?.user?.name || 'Nurse Sarah';
  const userRole = auth?.user?.role || 'Ward A • Head Nurse';

  const [showProfile, setShowProfile] = useState(false);
  const [editName, setEditName] = useState(userName);
  const [editRole, setEditRole] = useState(userRole);
  const { lastBackup, isBackingUp, runBackup } = useBackupManager();
  const [isRestoring, setIsRestoring] = useState(false);

  const handleManualBackup = useCallback(async () => {
    haptic.medium();
    const meta = await runBackup();
    if (meta) {
      Alert.alert('Backup Complete', `Saved ${Object.values(meta.tables).reduce((a, b) => a + b, 0)} records to iCloud.`);
    } else {
      Alert.alert('Backup Skipped', 'Check your internet connection.');
    }
  }, [runBackup]);

  const handleRestore = useCallback(async () => {
    Alert.alert(
      'Restore from iCloud',
      'This will replace all server data with the iCloud backup. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            setIsRestoring(true);
            try {
              const result = await restoreToServer();
              Alert.alert('Restore Complete', `Restored ${Object.values(result.counts).reduce((a, b) => a + b, 0)} records.`);
            } catch (err) {
              Alert.alert('Restore Failed', err.message);
            } finally {
              setIsRestoring(false);
            }
          },
        },
      ],
    );
  }, []);

  const handleClearBackup = useCallback(() => {
    Alert.alert('Clear Backup', 'Remove the local iCloud backup cache?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await clearBackup();
          Alert.alert('Cleared', 'Local backup cache removed.');
        },
      },
    ]);
  }, []);

  const handleSaveProfile = useCallback(() => {
    // Persist profile to AsyncStorage
    AsyncStorage.setItem(
      '@careconnect_profile',
      JSON.stringify({ name: editName.trim(), role: editRole.trim() }),
    );
    Alert.alert('Profile Updated', 'Your profile has been saved.');
    setShowProfile(false);
  }, [editName, editRole]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
    >
      {/* Gradient Header */}
      <LinearGradient
        colors={gradients.headerVibrant}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: insets.top + 8,
          paddingBottom: 20,
          paddingHorizontal: 20,
        }}
      >
        <Text style={[typography.largeTitle, { color: colors.textInverse }]}>
          Settings
        </Text>
        <Text
          style={[
            typography.footnote,
            { color: 'rgba(255,255,255,0.7)', marginTop: 4 },
          ]}
        >
          Preferences & account management
        </Text>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <AnimatedPressable
          hapticType="light"
          onPress={() => {
            setEditName(userName);
            setEditRole(userRole);
            setShowProfile(true);
          }}
        >
          <View style={{ marginBottom: 24, borderRadius: radius.xl, overflow: 'hidden', ...shadows.lg }}>
            <LinearGradient
              colors={['#EFF6FF', '#FFFFFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 16, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.primaryBorder }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <View style={{ borderWidth: 2.5, borderColor: colors.primary, borderRadius: 32, padding: 2 }}>
                  <Avatar name={userName} size={56} />
                </View>
                <View style={{ marginLeft: 14, flex: 1 }}>
                  <Text style={[typography.headline, { color: colors.text, fontWeight: '700' }]}>
                    {userName}
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      marginTop: 3,
                    }}
                  >
                    <View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                      <Stethoscope size={12} color={colors.primary} />
                    </View>
                    <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                      {userRole}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={20} color={colors.primary} />
              </View>
            </LinearGradient>
          </View>
        </AnimatedPressable>

        {/* Settings Groups */}
        <SettingsGroup title="Notifications">
          <SettingsItem
            icon={<Bell size={20} color={colors.primary} />}
            label="Push Alerts"
            subtitle="Get notified for all alerts"
            type="switch"
            value={pushAlerts}
            onValueChange={(v) => {
              setPushAlerts(v);
              persistSettings({ pushAlerts: v });
              if (v) {
                registerForPushNotifications(userName, userRole).catch(() => {});
              } else {
                unregisterPushNotifications().catch(() => {});
              }
            }}
          />
          <SettingsItem
            icon={<BellOff size={20} color={colors.textSecondary} />}
            label="High Priority Only"
            subtitle="Only critical and warning alerts"
            type="switch"
            value={highPriorityOnly}
            onValueChange={(v) => {
              setHighPriorityOnly(v);
              persistSettings({ highPriorityOnly: v });
            }}
          />
          <SettingsItem
            icon={<Volume2 size={20} color={colors.accent} />}
            label="Sound Effects"
            subtitle="Play sounds for alerts and actions"
            type="switch"
            value={soundEffects}
            onValueChange={(v) => {
              setSoundEffects(v);
              setAudioEnabled(v);
              persistSettings({ soundEffects: v });
            }}
            last
          />
        </SettingsGroup>

        <SettingsGroup title="Security">
          <SettingsItem
            icon={<Shield size={20} color={colors.statusStable} />}
            label="Biometric Unlock"
            subtitle="Face ID or fingerprint"
            type="switch"
            value={biometricUnlock}
            onValueChange={(v) => {
              setBiometricUnlock(v);
              persistSettings({ biometricUnlock: v });
            }}
          />
          <SettingsItem
            icon={<Lock size={20} color={colors.textSecondary} />}
            label="Session Timeout"
            value={sessionTimeout}
            onPress={handleSessionTimeout}
            last
          />
        </SettingsGroup>

        <SettingsGroup title="iCloud Backup">
          <SettingsItem
            icon={isBackingUp ? <ActivityIndicator size={20} color={colors.primary} /> : <Cloud size={20} color={colors.primary} />}
            label="Backup Now"
            subtitle={lastBackup ? `Last: ${new Date(lastBackup.createdAt).toLocaleString()}` : 'No backup yet'}
            onPress={handleManualBackup}
          />
          <SettingsItem
            icon={isRestoring ? <ActivityIndicator size={20} color={colors.statusStable} /> : <Download size={20} color={colors.statusStable} />}
            label="Restore from iCloud"
            subtitle="Replace server data with backup"
            onPress={handleRestore}
          />
          <SettingsItem
            icon={<CloudOff size={20} color={colors.danger} />}
            label="Clear Backup Cache"
            subtitle="Remove local iCloud backup"
            onPress={handleClearBackup}
            last
          />
        </SettingsGroup>

        <SettingsGroup title="Support">
          <SettingsItem
            icon={<HelpCircle size={20} color={colors.textSecondary} />}
            label="Help Center"
            onPress={() => router.push('/help')}
          />
          <SettingsItem
            icon={<Headphones size={20} color={colors.textSecondary} />}
            label="Device Support"
            onPress={() => Linking.openURL('mailto:christopher.appiahthompson@myworldclass.org')}
            last
          />
        </SettingsGroup>

        {/* App Version */}
        <Text
          style={{
            fontSize: 12,
            color: colors.textMuted,
            textAlign: 'center',
            marginBottom: 4,
          }}
        >
          CareConnect v1.0.0
        </Text>
        <Text
          style={{
            fontSize: 11,
            color: colors.textMuted,
            textAlign: 'center',
            marginBottom: 16,
          }}
        >
          © {new Date().getFullYear()} World Class Scholars. All rights reserved.
        </Text>

        {/* Sign Out */}
        <AnimatedPressable
          hapticType="heavy"
          onPress={handleSignOut}
          style={{ marginBottom: 20, borderRadius: radius.xl, overflow: 'hidden' }}
        >
          <LinearGradient
            colors={gradients.dangerVibrant}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
              borderRadius: radius.xl,
              ...shadows.colored(colors.danger),
            }}
          >
            <LogOut size={18} color={colors.textInverse} />
            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: colors.textInverse,
                marginLeft: 8,
              }}
            >
              Sign Out
            </Text>
          </LinearGradient>
        </AnimatedPressable>
      </ScrollView>

      {/* Profile Edit Modal */}
      <Modal
        visible={showProfile}
        animationType="slide"
        transparent
        onRequestClose={() => setShowProfile(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'flex-end' }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setShowProfile(false)}
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
          />
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 24,
              paddingBottom: insets.bottom + 24,
            }}
          >
            <Text
              style={[
                typography.title2,
                { color: colors.text, marginBottom: 20 },
              ]}
            >
              Edit Profile
            </Text>

            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: colors.textTertiary,
                marginBottom: 6,
              }}
            >
              NAME
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.surfaceBorder,
                borderRadius: radius.lg,
                padding: 14,
                fontSize: 16,
                color: colors.text,
                backgroundColor: colors.background,
                marginBottom: 16,
              }}
              value={editName}
              onChangeText={setEditName}
              placeholder="Your name"
              placeholderTextColor={colors.textMuted}
            />

            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: colors.textTertiary,
                marginBottom: 6,
              }}
            >
              ROLE
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.surfaceBorder,
                borderRadius: radius.lg,
                padding: 14,
                fontSize: 16,
                color: colors.text,
                backgroundColor: colors.background,
                marginBottom: 24,
              }}
              value={editRole}
              onChangeText={setEditRole}
              placeholder="Your role"
              placeholderTextColor={colors.textMuted}
            />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <AnimatedPressable
                onPress={() => setShowProfile(false)}
                hapticType="light"
                style={{
                  flex: 1,
                  padding: 16,
                  borderRadius: radius.lg,
                  backgroundColor: colors.surfaceSecondary,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: colors.textSecondary,
                  }}
                >
                  Cancel
                </Text>
              </AnimatedPressable>
              <AnimatedPressable
                onPress={handleSaveProfile}
                hapticType="success"
                style={{ flex: 1, borderRadius: radius.xl, overflow: 'hidden' }}
              >
                <LinearGradient
                  colors={gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    padding: 16,
                    borderRadius: radius.xl,
                    alignItems: 'center',
                    ...shadows.colored(colors.primary),
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '700',
                      color: colors.textInverse,
                    }}
                  >
                    Save
                  </Text>
                </LinearGradient>
              </AnimatedPressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function SettingsGroup({ title, children }) {
  return (
    <View style={{ marginBottom: 24 }}>
      <Text
        style={{
          fontSize: 13,
          fontWeight: '600',
          color: colors.textTertiary,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 8,
          marginLeft: 4,
        }}
      >
        {title}
      </Text>
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.surfaceBorder,
          ...shadows.sm,
        }}
      >
        {children}
      </View>
    </View>
  );
}

function SettingsItem({
  icon,
  label,
  subtitle,
  type,
  value,
  onValueChange,
  onPress,
  last,
}) {
  const handlePress = type !== 'switch' ? () => {
    haptic.light();
    onPress?.();
  } : undefined;

  return (
    <AnimatedPressable
      onPress={handlePress}
      disabled={type !== 'switch' && !onPress}
      hapticType={null}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: last ? 0 : 1,
        borderColor: colors.borderLight,
      }}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          backgroundColor: colors.primaryLight,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: '500', color: colors.text }}>
          {label}
        </Text>
        {subtitle && (
          <Text
            style={{ fontSize: 13, color: colors.textTertiary, marginTop: 1 }}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {type === 'switch' ? (
        <Switch
          value={value}
          onValueChange={(v) => {
            haptic.selection();
            onValueChange?.(v);
          }}
          trackColor={{ true: colors.primary, false: colors.divider }}
          thumbColor="#FFFFFF"
        />
      ) : value ? (
        <Text style={{ fontSize: 14, color: colors.textMuted, marginRight: 4 }}>
          {value}
        </Text>
      ) : (
        <ChevronRight size={18} color={colors.textMuted} />
      )}
    </AnimatedPressable>
  );
}
