// Copyright (c) 2026 World Class Scholars, led by Dr Christopher Appiah-Thompson. All rights reserved.
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  HelpCircle,
  Mail,
  BookOpen,
  Shield,
  Heart,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertTriangle,
  Users,
  Phone,
  Globe,
  Award,
  GraduationCap,
} from 'lucide-react-native';
import { colors, radius, typography, shadows, gradients } from '../../theme';
import AnimatedPressable from '../../components/AnimatedPressable';
import { haptic } from '../../utils/haptics';

const CURRENT_YEAR = new Date().getFullYear();

const FAQ_SECTIONS = [
  {
    title: 'Getting Started',
    icon: BookOpen,
    items: [
      {
        q: 'How do I add a new resident?',
        a: 'Navigate to the Residents tab, tap the "+" button in the top-right corner, and fill in the resident\'s details including name, age, room number, and care level.',
      },
      {
        q: 'How do I navigate between sections?',
        a: 'Use the tab bar at the bottom of the screen. CareConnect has 8 main sections: Residents, Alerts, Tasks, Messages, Medications, Interactions, Med Search, and Settings.',
      },
      {
        q: 'Can I use CareConnect offline?',
        a: 'Yes. CareConnect supports offline mode with automatic sync. When you go offline, changes are queued locally and synced to the server when connectivity is restored.',
      },
    ],
  },
  {
    title: 'Alerts & Notifications',
    icon: AlertTriangle,
    items: [
      {
        q: 'How do push notifications work?',
        a: 'Enable Push Alerts in Settings to receive real-time notifications for critical events, medication reminders, and task updates via Apple Push Notification Service (APNs).',
      },
      {
        q: 'Can I filter alerts by priority?',
        a: 'Yes. On the Alerts tab, use the status filter tabs to view Open, In Progress, or Resolved alerts. You can also enable "High Priority Only" in Settings.',
      },
      {
        q: 'How do I resolve an alert?',
        a: 'Tap any alert to see its details, then swipe or tap "Resolve" to mark it as handled. All state changes are synced to the server in real time.',
      },
    ],
  },
  {
    title: 'Messages & Communication',
    icon: Users,
    items: [
      {
        q: 'Is messaging real-time?',
        a: 'Yes. CareConnect uses WebSocket connections for instant message delivery, typing indicators, read receipts, and online presence status.',
      },
      {
        q: 'Can I see when someone is typing?',
        a: 'Yes. When a colleague is composing a message, you\'ll see a typing indicator with animated dots in the conversation.',
      },
      {
        q: 'Are messages backed up?',
        a: 'Yes. Messages are stored on the server (Supabase PostgreSQL) and can be backed up to iCloud via Settings → iCloud Backup.',
      },
    ],
  },
  {
    title: 'Data & Privacy',
    icon: Shield,
    items: [
      {
        q: 'How is resident data protected?',
        a: 'All data is transmitted over encrypted connections (HTTPS/WSS). CareConnect supports biometric unlock (Face ID / fingerprint) and configurable session timeouts for additional security.',
      },
      {
        q: 'How does iCloud Backup work?',
        a: 'Navigate to Settings → iCloud Backup → Backup Now. Your data is saved securely to AsyncStorage with React Query persistence. You can restore from backup at any time.',
      },
      {
        q: 'Who can access CareConnect data?',
        a: 'Only authorised care staff with valid credentials can access the system. Role-based permissions ensure staff see only the data relevant to their responsibilities.',
      },
    ],
  },
  {
    title: 'Medications & Interactions',
    icon: FileText,
    items: [
      {
        q: 'How do I check drug interactions?',
        a: 'Use the Interactions tab to select two or more medications and instantly see potential interactions, severity levels, and clinical guidance.',
      },
      {
        q: 'Can I search for medication information?',
        a: 'Yes. The Med Search tab provides comprehensive medication lookup with dosage guidelines, side effects, and contraindications.',
      },
    ],
  },
];

export default function HelpCentreScreen() {
  const insets = useSafeAreaInsets();
  const [expandedSection, setExpandedSection] = useState(null);
  const [expandedItem, setExpandedItem] = useState(null);

  const toggleSection = (idx) => {
    haptic.light();
    setExpandedSection(expandedSection === idx ? null : idx);
    setExpandedItem(null);
  };

  const toggleItem = (sectionIdx, itemIdx) => {
    haptic.selection();
    const key = `${sectionIdx}-${itemIdx}`;
    setExpandedItem(expandedItem === key ? null : key);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Gradient Header */}
      <LinearGradient
        colors={gradients.headerVibrant}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: insets.top + 8,
          paddingBottom: 24,
          paddingHorizontal: 20,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: 'rgba(255,255,255,0.2)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <HelpCircle size={22} color="#FFFFFF" strokeWidth={2.2} />
          </View>
          <View>
            <Text style={[typography.largeTitle, { color: colors.textInverse }]}>
              Help Centre
            </Text>
            <Text
              style={[
                typography.footnote,
                { color: 'rgba(255,255,255,0.7)', marginTop: 2 },
              ]}
            >
              FAQs, support & documentation
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
      >
        {/* WCS Branding Card */}
        <View
          style={{
            marginBottom: 24,
            borderRadius: radius.xl,
            overflow: 'hidden',
            ...shadows.lg,
          }}
        >
          <LinearGradient
            colors={['#EFF6FF', '#FFFFFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              padding: 20,
              borderRadius: radius.xl,
              borderWidth: 1,
              borderColor: colors.primaryBorder,
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
                ...shadows.colored(colors.primary),
              }}
            >
              <GraduationCap size={32} color="#FFFFFF" strokeWidth={2} />
            </View>
            <Text
              style={[
                typography.title2,
                { color: colors.text, textAlign: 'center' },
              ]}
            >
              World Class Scholars
            </Text>
            <Text
              style={[
                typography.footnote,
                {
                  color: colors.textTertiary,
                  textAlign: 'center',
                  marginTop: 4,
                  lineHeight: 18,
                },
              ]}
            >
              Empowering excellence in aged care through{'\n'}
              technology and innovation
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 12,
                paddingHorizontal: 14,
                paddingVertical: 8,
                backgroundColor: colors.primaryLight,
                borderRadius: radius.full,
              }}
            >
              <Award size={14} color={colors.primary} />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: colors.primary,
                  marginLeft: 6,
                }}
              >
                CareConnect by WCS
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Contact Support Card */}
        <AnimatedPressable
          hapticType="light"
          onPress={() =>
            Linking.openURL(
              'mailto:christopher.appiahthompson@myworldclass.org?subject=CareConnect%20Support%20Request',
            )
          }
        >
          <View
            style={{
              marginBottom: 24,
              borderRadius: radius.xl,
              overflow: 'hidden',
              ...shadows.md,
            }}
          >
            <LinearGradient
              colors={gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                padding: 18,
                borderRadius: radius.xl,
                flexDirection: 'row',
                alignItems: 'center',
                ...shadows.colored(colors.primary),
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Mail size={22} color="#FFFFFF" />
              </View>
              <View style={{ marginLeft: 14, flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: '#FFFFFF',
                  }}
                >
                  Contact Support
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.8)',
                    marginTop: 2,
                  }}
                >
                  christopher.appiahthompson@myworldclass.org
                </Text>
              </View>
              <Mail size={16} color="rgba(255,255,255,0.5)" />
            </LinearGradient>
          </View>
        </AnimatedPressable>

        {/* Quick Links */}
        <Text
          style={{
            fontSize: 13,
            fontWeight: '600',
            color: colors.textTertiary,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 10,
            marginLeft: 4,
          }}
        >
          Quick Links
        </Text>
        <View
          style={{
            flexDirection: 'row',
            gap: 12,
            marginBottom: 24,
          }}
        >
          {[
            {
              icon: Globe,
              label: 'Website',
              color: colors.primary,
              onPress: () => Linking.openURL('https://www.myworldclass.org'),
            },
            {
              icon: Mail,
              label: 'Email Us',
              color: '#7C3AED',
              onPress: () =>
                Linking.openURL(
                  'mailto:christopher.appiahthompson@myworldclass.org',
                ),
            },
            {
              icon: Phone,
              label: 'Call Support',
              color: colors.statusStable,
              onPress: () => Linking.openURL('tel:+61000000000'),
            },
          ].map(({ icon: Icon, label, color, onPress }, i) => (
            <AnimatedPressable
              key={i}
              hapticType="light"
              onPress={onPress}
              style={{ flex: 1 }}
            >
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: radius.xl,
                  padding: 16,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: colors.surfaceBorder,
                  ...shadows.sm,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: `${color}15`,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 8,
                  }}
                >
                  <Icon size={20} color={color} />
                </View>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: colors.textSecondary,
                  }}
                >
                  {label}
                </Text>
              </View>
            </AnimatedPressable>
          ))}
        </View>

        {/* FAQ Accordion */}
        <Text
          style={{
            fontSize: 13,
            fontWeight: '600',
            color: colors.textTertiary,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 10,
            marginLeft: 4,
          }}
        >
          Frequently Asked Questions
        </Text>

        {FAQ_SECTIONS.map((section, sIdx) => {
          const SectionIcon = section.icon;
          const isOpen = expandedSection === sIdx;

          return (
            <View
              key={sIdx}
              style={{
                marginBottom: 12,
                borderRadius: radius.xl,
                overflow: 'hidden',
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: isOpen ? colors.primaryBorder : colors.surfaceBorder,
                ...shadows.sm,
              }}
            >
              <AnimatedPressable
                hapticType={null}
                onPress={() => toggleSection(sIdx)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                }}
              >
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    backgroundColor: isOpen
                      ? colors.primaryLight
                      : colors.surfaceSecondary,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <SectionIcon
                    size={18}
                    color={isOpen ? colors.primary : colors.textTertiary}
                  />
                </View>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 16,
                    fontWeight: '600',
                    color: isOpen ? colors.primary : colors.text,
                    marginLeft: 12,
                  }}
                >
                  {section.title}
                </Text>
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    backgroundColor: isOpen
                      ? colors.primaryLight
                      : colors.surfaceSecondary,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isOpen ? (
                    <ChevronUp size={16} color={colors.primary} />
                  ) : (
                    <ChevronDown size={16} color={colors.textMuted} />
                  )}
                </View>
              </AnimatedPressable>

              {isOpen &&
                section.items.map((item, iIdx) => {
                  const itemKey = `${sIdx}-${iIdx}`;
                  const isItemOpen = expandedItem === itemKey;

                  return (
                    <View key={iIdx}>
                      <AnimatedPressable
                        hapticType={null}
                        onPress={() => toggleItem(sIdx, iIdx)}
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 14,
                          marginHorizontal: 12,
                          marginBottom: 4,
                          backgroundColor: isItemOpen
                            ? colors.primaryLight
                            : colors.surfaceSecondary,
                          borderRadius: radius.lg,
                        }}
                      >
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                          }}
                        >
                          <View
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: isItemOpen
                                ? colors.primary
                                : colors.textMuted,
                              marginRight: 10,
                            }}
                          />
                          <Text
                            style={{
                              flex: 1,
                              fontSize: 14,
                              fontWeight: '600',
                              color: isItemOpen
                                ? colors.primary
                                : colors.text,
                            }}
                          >
                            {item.q}
                          </Text>
                          {isItemOpen ? (
                            <ChevronUp size={14} color={colors.primary} />
                          ) : (
                            <ChevronDown size={14} color={colors.textMuted} />
                          )}
                        </View>

                        {isItemOpen && (
                          <Text
                            style={{
                              fontSize: 13,
                              color: colors.textSecondary,
                              lineHeight: 20,
                              marginTop: 10,
                              marginLeft: 16,
                            }}
                          >
                            {item.a}
                          </Text>
                        )}
                      </AnimatedPressable>
                    </View>
                  );
                })}

              {isOpen && <View style={{ height: 12 }} />}
            </View>
          );
        })}

        {/* App Info Section */}
        <View
          style={{
            marginTop: 20,
            borderRadius: radius.xl,
            overflow: 'hidden',
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.surfaceBorder,
            padding: 20,
            ...shadows.sm,
          }}
        >
          <View style={{ alignItems: 'center' }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                backgroundColor: colors.primaryLight,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <Heart size={24} color={colors.primary} />
            </View>
            <Text
              style={[
                typography.headline,
                { color: colors.text, textAlign: 'center' },
              ]}
            >
              CareConnect
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: colors.textMuted,
                textAlign: 'center',
                marginTop: 4,
              }}
            >
              Version 1.0.0 • Built with Expo SDK 54
            </Text>

            {/* Divider */}
            <View
              style={{
                width: '100%',
                height: 1,
                backgroundColor: colors.borderLight,
                marginVertical: 16,
              }}
            />

            {/* Copyright & Legal */}
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: colors.text,
                textAlign: 'center',
                marginBottom: 6,
              }}
            >
              © {CURRENT_YEAR} World Class Scholars. All rights reserved.
            </Text>
            <Text
              style={{
                fontSize: 11,
                color: colors.textMuted,
                textAlign: 'center',
                lineHeight: 17,
                marginBottom: 8,
              }}
            >
              CareConnect™ is a trademark of World Class Scholars.{'\n'}
              Developed and maintained by WCS Technology Division.
            </Text>
            <Text
              style={{
                fontSize: 11,
                color: colors.textTertiary,
                textAlign: 'center',
                lineHeight: 17,
                marginBottom: 12,
              }}
            >
              This software is proprietary and confidential.{'\n'}
              Unauthorised reproduction or distribution of this{'\n'}
              application, or any portion of it, may result in{'\n'}
              severe civil and criminal penalties.
            </Text>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                marginBottom: 8,
              }}
            >
              <Mail size={12} color={colors.textMuted} />
              <Text
                style={{
                  fontSize: 11,
                  color: colors.textMuted,
                }}
              >
                christopher.appiahthompson@myworldclass.org
              </Text>
            </View>

            <View
              style={{
                flexDirection: 'row',
                gap: 16,
                marginTop: 4,
              }}
            >
              <AnimatedPressable
                hapticType="light"
                onPress={() =>
                  Linking.openURL('https://www.myworldclass.org/privacy')
                }
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '500',
                    color: colors.primary,
                  }}
                >
                  Privacy Policy
                </Text>
              </AnimatedPressable>
              <Text style={{ fontSize: 12, color: colors.textMuted }}>•</Text>
              <AnimatedPressable
                hapticType="light"
                onPress={() =>
                  Linking.openURL('https://www.myworldclass.org/terms')
                }
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '500',
                    color: colors.primary,
                  }}
                >
                  Terms of Service
                </Text>
              </AnimatedPressable>
              <Text style={{ fontSize: 12, color: colors.textMuted }}>•</Text>
              <AnimatedPressable
                hapticType="light"
                onPress={() =>
                  Linking.openURL('https://www.myworldclass.org/licenses')
                }
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '500',
                    color: colors.primary,
                  }}
                >
                  Licenses
                </Text>
              </AnimatedPressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
