import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
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
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, typography, shadows } from '../../theme';
import { useAuth } from '../../utils/auth/useAuth';
import Avatar from '../../components/Avatar';
import Card from '../../components/Card';

const SETTINGS_KEY = '@careconnect_settings';
const TIMEOUT_OPTIONS = ['5 mins', '10 mins', '15 mins', '20 mins', '30 mins'];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { signOut, auth } = useAuth();
  const [pushAlerts, setPushAlerts] = useState(true);
  const [highPriorityOnly, setHighPriorityOnly] = useState(false);
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

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: insets.top,
      }}
    >
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 12,
          backgroundColor: colors.surface,
          ...shadows.sm,
        }}
      >
        <Text style={[typography.title2, { color: colors.text }]}>
          Settings
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() =>
            Alert.alert(
              'Profile',
              `${userName}\n${userRole}\n\nProfile editing coming soon.`,
            )
          }
        >
          <Card variant="elevated" style={{ marginBottom: 24 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Avatar name={userName} size={56} />
              <View style={{ marginLeft: 14, flex: 1 }}>
                <Text style={[typography.headline, { color: colors.text }]}>
                  {userName}
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 2,
                  }}
                >
                  <Stethoscope size={13} color={colors.primary} />
                  <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                    {userRole}
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color={colors.textMuted} />
            </View>
          </Card>
        </TouchableOpacity>

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

        <SettingsGroup title="Support">
          <SettingsItem
            icon={<HelpCircle size={20} color={colors.textSecondary} />}
            label="Help Center"
            onPress={() => Linking.openURL('https://careconnect.help')}
          />
          <SettingsItem
            icon={<Headphones size={20} color={colors.textSecondary} />}
            label="Device Support"
            onPress={() => Linking.openURL('mailto:support@careconnect.com')}
            last
          />
        </SettingsGroup>

        {/* App Version */}
        <Text
          style={{
            fontSize: 12,
            color: colors.textMuted,
            textAlign: 'center',
            marginBottom: 16,
          }}
        >
          CareConnect v1.0.0
        </Text>

        {/* Sign Out */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleSignOut}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 14,
            marginBottom: 20,
            backgroundColor: '#FEF2F2',
            borderRadius: radius.lg,
          }}
        >
          <LogOut size={18} color={colors.statusCritical} />
          <Text
            style={{
              fontSize: 15,
              fontWeight: '600',
              color: colors.statusCritical,
              marginLeft: 8,
            }}
          >
            Sign Out
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
  return (
    <TouchableOpacity
      activeOpacity={0.6}
      onPress={type !== 'switch' ? onPress : undefined}
      disabled={type === 'switch' && !onPress}
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
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: colors.surfaceSecondary,
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
          onValueChange={onValueChange}
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
    </TouchableOpacity>
  );
}
