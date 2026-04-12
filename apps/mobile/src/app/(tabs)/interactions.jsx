import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Plus,
  X,
  ArrowRightLeft,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Info,
  Pill,
} from 'lucide-react-native';
import { colors, radius, shadows, typography, gradients } from '../../theme';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import AnimatedPressable from '../../components/AnimatedPressable';
import GradientHeader from '../../components/GradientHeader';
import haptic from '../../utils/haptics';
import {
  checkDrugInteractions,
  COMMON_MEDICATIONS,
} from '../../services/auMedApi';

const SEVERITY_STYLES = {
  high: {
    bg: colors.dangerLight,
    color: colors.dangerDark,
    icon: ShieldAlert,
    border: colors.danger,
    label: 'High Risk',
  },
  N_A: {
    bg: colors.warningLight,
    color: colors.warningDark,
    icon: Shield,
    border: colors.warning,
    label: 'Check Required',
  },
};

function getSeverityStyle(severity) {
  const key = severity?.toLowerCase?.() === 'high' ? 'high' : 'N_A';
  return SEVERITY_STYLES[key] || SEVERITY_STYLES.N_A;
}

export default function InteractionsScreen() {
  const [selectedMeds, setSelectedMeds] = useState([]);
  const [showPicker, setShowPicker] = useState(false);

  // Check interactions when 2+ meds selected — uses drug names now (OpenFDA)
  const drugNames = selectedMeds.map((m) => m.name);
  const {
    data: interactions = [],
    isFetching: checking,
    refetch,
  } = useQuery({
    queryKey: ['interactions', drugNames.sort().join(',')],
    queryFn: () => checkDrugInteractions(drugNames),
    enabled: drugNames.length >= 2,
    staleTime: 300000,
  });

  const addMed = useCallback(
    (med) => {
      if (selectedMeds.find((m) => m.rxcui === med.rxcui)) return;
      setSelectedMeds((prev) => [...prev, med]);
      setShowPicker(false);
    },
    [selectedMeds],
  );

  const removeMed = useCallback((rxcui) => {
    setSelectedMeds((prev) => prev.filter((m) => m.rxcui !== rxcui));
  }, []);

  const clearAll = useCallback(() => {
    setSelectedMeds([]);
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
    >
      {/* Header */}
      <GradientHeader
        title="Interactions"
        subtitle="Check drug-drug interactions via OpenFDA labels"
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 120,
          paddingTop: 12,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Selected medications */}
        <Text
          style={[
            typography.caption,
            { color: colors.textTertiary, marginBottom: 8 },
          ]}
        >
          SELECTED MEDICATIONS ({selectedMeds.length})
        </Text>

        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 12,
          }}
        >
          {selectedMeds.map((med) => (
            <View
              key={med.rxcui}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.primaryLight,
                borderRadius: radius.full,
                paddingLeft: 14,
                paddingRight: 6,
                paddingVertical: 8,
                borderWidth: 1,
                borderColor: colors.primaryBorder,
              }}
            >
              <Pill size={14} color={colors.primary} />
              <Text
                style={[
                  typography.footnote,
                  { color: colors.primary, marginLeft: 6, fontWeight: '600' },
                ]}
              >
                {med.name}
              </Text>
              <AnimatedPressable
                onPress={() => { haptic.light(); removeMed(med.rxcui); }}
                hapticType="light"
                style={{ marginLeft: 6, padding: 4 }}
              >
                <X size={14} color={colors.primary} />
              </AnimatedPressable>
            </View>
          ))}

          {/* Add button */}
          <AnimatedPressable
            onPress={() => { haptic.selection(); setShowPicker(!showPicker); }}
            hapticType="selection"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.surface,
              borderRadius: radius.full,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderWidth: 1,
              borderColor: colors.surfaceBorder,
              borderStyle: 'dashed',
            }}
          >
            <Plus size={16} color={colors.textMuted} />
            <Text
              style={[
                typography.footnote,
                { color: colors.textMuted, marginLeft: 4 },
              ]}
            >
              Add Drug
            </Text>
          </AnimatedPressable>

          {selectedMeds.length > 0 && (
            <AnimatedPressable
              onPress={() => { haptic.warning(); clearAll(); }}
              hapticType="warning"
              style={{ justifyContent: 'center', paddingHorizontal: 8 }}
            >
              <Text style={[typography.caption, { color: colors.danger }]}>
                Clear all
              </Text>
            </AnimatedPressable>
          )}
        </View>

        {/* Quick-pick of common meds */}
        {showPicker && (
          <Card style={{ marginBottom: 16 }}>
            <Text
              style={[
                typography.caption,
                { color: colors.textTertiary, marginBottom: 8 },
              ]}
            >
              TAP TO ADD — COMMON AGED CARE MEDICATIONS
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {COMMON_MEDICATIONS.filter(
                (m) => !selectedMeds.find((s) => s.rxcui === m.rxcui),
              ).map((med) => (
                <AnimatedPressable
                  key={med.rxcui}
                  onPress={() => { haptic.selection(); addMed(med); }}
                  hapticType="selection"
                  style={{
                    backgroundColor: colors.surfaceSecondary,
                    borderRadius: radius.full,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                  }}
                >
                  <Text style={[typography.footnote, { color: colors.text }]}>
                    {med.name}
                  </Text>
                </AnimatedPressable>
              ))}
            </View>
          </Card>
        )}

        {/* Status */}
        {selectedMeds.length < 2 && (
          <Card style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ArrowRightLeft size={20} color={colors.textMuted} />
              <Text
                style={[
                  typography.callout,
                  { color: colors.textTertiary, marginLeft: 10, flex: 1 },
                ]}
              >
                Select at least 2 medications to check for interactions
              </Text>
            </View>
          </Card>
        )}

        {/* Loading */}
        {checking && selectedMeds.length >= 2 && (
          <View style={{ alignItems: 'center', paddingVertical: 32 }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text
              style={[
                typography.footnote,
                { color: colors.textTertiary, marginTop: 12 },
              ]}
            >
              Checking {selectedMeds.length} medications for interactions…
            </Text>
          </View>
        )}

        {/* Interaction results */}
        {!checking && interactions.length > 0 && (
          <View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <AlertTriangle size={18} color={colors.danger} />
              <Text
                style={[
                  typography.headline,
                  { color: colors.text, marginLeft: 8 },
                ]}
              >
                {interactions.length} Interaction
                {interactions.length > 1 ? 's' : ''} Found
              </Text>
            </View>

            {interactions.map((ix, i) => {
              const style = getSeverityStyle(ix.severity);
              const Icon = style.icon;
              return (
                <Card key={i} style={{ marginBottom: 12 }}>
                  <View
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 4,
                      backgroundColor: style.border,
                      borderTopLeftRadius: radius.lg,
                      borderBottomLeftRadius: radius.lg,
                    }}
                  />
                  <View style={{ paddingLeft: 4 }}>
                    {/* Severity label */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 8,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: style.bg,
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: radius.full,
                        }}
                      >
                        <Icon size={14} color={style.color} />
                        <Text
                          style={[
                            typography.caption,
                            {
                              color: style.color,
                              marginLeft: 4,
                              fontWeight: '700',
                            },
                          ]}
                        >
                          {style.label}
                        </Text>
                      </View>
                    </View>

                    {/* Drugs involved */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 8,
                        gap: 4,
                      }}
                    >
                      {ix.drugs.filter(Boolean).map((drug, j) => (
                        <React.Fragment key={j}>
                          {j > 0 && (
                            <ArrowRightLeft
                              size={14}
                              color={colors.textMuted}
                            />
                          )}
                          <View
                            style={{
                              backgroundColor: colors.surfaceSecondary,
                              paddingHorizontal: 10,
                              paddingVertical: 4,
                              borderRadius: radius.sm,
                            }}
                          >
                            <Text
                              style={[
                                typography.caption,
                                { color: colors.text, fontWeight: '600' },
                              ]}
                            >
                              {drug}
                            </Text>
                          </View>
                        </React.Fragment>
                      ))}
                    </View>

                    {/* Description */}
                    <Text
                      style={[
                        typography.footnote,
                        { color: colors.textSecondary, lineHeight: 20 },
                      ]}
                    >
                      {ix.description}
                    </Text>
                  </View>
                </Card>
              );
            })}
          </View>
        )}

        {/* No interactions found */}
        {!checking && selectedMeds.length >= 2 && interactions.length === 0 && (
          <Card
            style={{
              marginBottom: 16,
              alignItems: 'center',
              paddingVertical: 32,
            }}
          >
            <ShieldCheck size={48} color={colors.success} />
            <Text
              style={[
                typography.headline,
                { color: colors.text, marginTop: 12, textAlign: 'center' },
              ]}
            >
              No Known Interactions
            </Text>
            <Text
              style={[
                typography.footnote,
                {
                  color: colors.textTertiary,
                  marginTop: 6,
                  textAlign: 'center',
                  maxWidth: 280,
                },
              ]}
            >
              No interactions were found between these medications in the RxNorm
              database. Always consult a healthcare professional.
            </Text>
          </Card>
        )}

        {/* Data source disclaimer */}
        <Card style={{ marginTop: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <Info size={18} color={colors.primary} style={{ marginTop: 2 }} />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={[typography.subhead, { color: colors.text }]}>
                Clinical Disclaimer
              </Text>
              <Text
                style={[
                  typography.footnote,
                  { color: colors.textTertiary, marginTop: 4, lineHeight: 20 },
                ]}
              >
                Interaction data sourced from NLM RxNorm API. This tool is for
                informational purposes only and does not replace professional
                medical advice. Always verify with a qualified pharmacist or
                physician.
              </Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}
