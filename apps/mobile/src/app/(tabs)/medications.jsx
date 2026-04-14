// Copyright (c) 2026 World Class Scholars, led by Dr Christopher Appiah-Thompson. All rights reserved.
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Pill,
  AlertTriangle,
  ChevronRight,
  Info,
  X,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadows, typography, gradients } from '../../theme';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import AnimatedPressable from '../../components/AnimatedPressable';
import {
  searchDrugs,
  topAdverseReactions,
  getDrugByRxcui,
  suggestDrugSpelling,
  searchAdverseEvents,
  COMMON_MEDICATIONS,
} from '../../services/auMedApi';

export default function MedicationsScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [selectedDrug, setSelectedDrug] = useState(null);

  // Drug search via RxNorm
  const { data: drugs = [], isFetching: isSearching } = useQuery({
    queryKey: ['drugSearch', search],
    queryFn: () => searchDrugs(search),
    enabled: search.trim().length >= 2,
    staleTime: 60000,
    placeholderData: (prev) => prev,
  });

  // Drug details (when selected)
  const { data: drugInfo, isFetching: loadingInfo } = useQuery({
    queryKey: ['drugInfo', selectedDrug?.rxcui],
    queryFn: () => getDrugByRxcui(selectedDrug.rxcui),
    enabled: !!selectedDrug?.rxcui,
    staleTime: 300000,
  });

  // Top adverse reactions for selected drug (OpenFDA)
  const { data: reactions = [], isFetching: loadingReactions } = useQuery({
    queryKey: ['adverseReactions', selectedDrug?.name],
    queryFn: () => topAdverseReactions(selectedDrug.name, 8),
    enabled: !!selectedDrug?.name,
    staleTime: 300000,
  });

  // Spelling suggestions when no results found
  const { data: suggestions = [] } = useQuery({
    queryKey: ['spellingSuggestions', search],
    queryFn: () => suggestDrugSpelling(search),
    enabled: search.trim().length >= 2 && drugs.length === 0 && !isSearching,
    staleTime: 60000,
  });

  // Detailed adverse events for selected drug (OpenFDA)
  const { data: adverseEvents = [], isFetching: loadingEvents } = useQuery({
    queryKey: ['adverseEvents', selectedDrug?.name],
    queryFn: () => searchAdverseEvents(selectedDrug.name, 5),
    enabled: !!selectedDrug?.name,
    staleTime: 300000,
  });

  const displayDrugs = search.trim().length >= 2 ? drugs : [];

  const clearSelection = useCallback(() => {
    setSelectedDrug(null);
  }, []);

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
          Medications
        </Text>
        <Text
          style={[
            typography.footnote,
            { color: 'rgba(255,255,255,0.7)', marginTop: 4 },
          ]}
        >
          Australian drug data via RxNorm & OpenFDA
        </Text>
      </LinearGradient>

      {/* Search bar */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 12 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.9)' : colors.surface,
            borderRadius: radius.xl,
            paddingHorizontal: 16,
            height: 52,
            borderWidth: 1,
            borderColor: colors.primaryBorder,
            ...shadows.md,
          }}
        >
          <Search size={20} color={colors.textMuted} />
          <TextInput
            style={{
              flex: 1,
              marginLeft: 10,
              fontSize: 16,
              color: colors.text,
            }}
            placeholder="Search medications (e.g. Metformin)"
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={(text) => {
              setSearch(text);
              if (text.length < 2) setSelectedDrug(null);
            }}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {isSearching && (
            <ActivityIndicator size="small" color={colors.primary} />
          )}
          {search.length > 0 && (
            <AnimatedPressable
              onPress={() => {
                setSearch('');
                setSelectedDrug(null);
              }}
              hapticType="light"
            >
              <X size={18} color={colors.textMuted} />
            </AnimatedPressable>
          )}
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Selected drug detail panel */}
        {selectedDrug && (
          <Card variant="elevated" style={{ marginBottom: 16 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={[typography.headline, { color: colors.text }]}>
                  {selectedDrug.name}
                </Text>
                {selectedDrug.tty && (
                  <View
                    style={{
                      backgroundColor: colors.primaryLight,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: radius.sm,
                      alignSelf: 'flex-start',
                      marginTop: 4,
                    }}
                  >
                    <Text
                      style={[typography.caption, { color: colors.primary }]}
                    >
                      RxCUI: {selectedDrug.rxcui}
                    </Text>
                  </View>
                )}
              </View>
              <AnimatedPressable onPress={clearSelection} hapticType="light">
                <X size={20} color={colors.textMuted} />
              </AnimatedPressable>
            </View>

            {/* Drug info from RxNorm */}
            {loadingInfo ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={{ marginTop: 12 }}
              />
            ) : drugInfo ? (
              <View style={{ marginTop: 12 }}>
                {drugInfo.ingredients.length > 0 && (
                  <View style={{ marginBottom: 8 }}>
                    <Text
                      style={[
                        typography.caption,
                        { color: colors.textTertiary, marginBottom: 4 },
                      ]}
                    >
                      ACTIVE INGREDIENTS
                    </Text>
                    <View
                      style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}
                    >
                      {drugInfo.ingredients.map((ing, i) => (
                        <View
                          key={i}
                          style={{
                            backgroundColor: colors.successLight,
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: radius.full,
                          }}
                        >
                          <Text
                            style={[
                              typography.caption,
                              { color: colors.successDark },
                            ]}
                          >
                            {ing}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                {drugInfo.brandNames.length > 0 && (
                  <View style={{ marginBottom: 8 }}>
                    <Text
                      style={[
                        typography.caption,
                        { color: colors.textTertiary, marginBottom: 4 },
                      ]}
                    >
                      BRAND NAMES
                    </Text>
                    <Text
                      style={[
                        typography.callout,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {drugInfo.brandNames.slice(0, 5).join(', ')}
                      {drugInfo.brandNames.length > 5 &&
                        ` +${drugInfo.brandNames.length - 5} more`}
                    </Text>
                  </View>
                )}
                {drugInfo.doseForms.length > 0 && (
                  <View>
                    <Text
                      style={[
                        typography.caption,
                        { color: colors.textTertiary, marginBottom: 4 },
                      ]}
                    >
                      DOSE FORMS
                    </Text>
                    <Text
                      style={[
                        typography.callout,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {drugInfo.doseForms.join(', ')}
                    </Text>
                  </View>
                )}
              </View>
            ) : null}

            {/* Adverse reactions from OpenFDA */}
            {reactions.length > 0 && (
              <View style={{ marginTop: 16 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 8,
                  }}
                >
                  <AlertTriangle size={16} color={colors.warning} />
                  <Text
                    style={[
                      typography.caption,
                      { color: colors.textTertiary, marginLeft: 6 },
                    ]}
                  >
                    TOP ADVERSE REACTIONS (FDA DATA)
                  </Text>
                </View>
                {reactions.map((r, i) => {
                  const maxCount = reactions[0]?.count || 1;
                  const pct = (r.count / maxCount) * 100;
                  return (
                    <View key={i} style={{ marginBottom: 8 }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          marginBottom: 3,
                        }}
                      >
                        <Text
                          style={[
                            typography.footnote,
                            { color: colors.text, flex: 1 },
                          ]}
                        >
                          {r.reaction}
                        </Text>
                        <Text
                          style={[
                            typography.caption,
                            { color: colors.textMuted },
                          ]}
                        >
                          {r.count.toLocaleString()}
                        </Text>
                      </View>
                      <View
                        style={{
                          height: 8,
                          backgroundColor: colors.borderLight,
                          borderRadius: 4,
                          overflow: 'hidden',
                        }}
                      >
                        <LinearGradient
                          colors={
                            pct > 70
                              ? gradients.danger
                              : pct > 40
                                ? gradients.warning
                                : gradients.primary
                          }
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={{
                            height: '100%',
                            width: `${pct}%`,
                            borderRadius: 4,
                          }}
                        />
                      </View>
                    </View>
                  );
                })}
                {loadingReactions && (
                  <ActivityIndicator size="small" color={colors.primary} />
                )}
              </View>
            )}

            {/* Detailed adverse events from OpenFDA */}
            {adverseEvents.length > 0 && (
              <View style={{ marginTop: 16 }}>
                <Text
                  style={[
                    typography.caption,
                    { color: colors.textTertiary, marginBottom: 8 },
                  ]}
                >
                  RECENT ADVERSE EVENT REPORTS (FDA)
                </Text>
                {adverseEvents.map((evt, i) => (
                  <View
                    key={i}
                    style={{
                      backgroundColor: colors.surfaceSecondary,
                      borderRadius: radius.md,
                      padding: 10,
                      marginBottom: 6,
                    }}
                  >
                    <Text
                      style={[
                        typography.caption,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {evt.reactions?.join(', ') || 'No reaction data'}
                    </Text>
                    {evt.serious && evt.seriousnessDescription?.length > 0 && (
                      <Text
                        style={[
                          typography.caption,
                          { color: colors.danger, marginTop: 2 },
                        ]}
                      >
                        Serious: {evt.seriousnessDescription.join(', ')}
                      </Text>
                    )}
                  </View>
                ))}
                {loadingEvents && (
                  <ActivityIndicator size="small" color={colors.primary} />
                )}
              </View>
            )}
          </Card>
        )}

        {/* Search results */}
        {displayDrugs.length > 0 && !selectedDrug && (
          <View style={{ marginBottom: 16 }}>
            <Text
              style={[
                typography.caption,
                { color: colors.textTertiary, marginBottom: 8 },
              ]}
            >
              SEARCH RESULTS — {displayDrugs.length} found
            </Text>
            {displayDrugs.slice(0, 20).map((drug, i) => (
              <AnimatedPressable
                key={`${drug.rxcui}-${i}`}
                onPress={() => {
                  setSelectedDrug(drug);
                }}
                hapticType="selection"
              >
                <Card style={{ marginBottom: 8 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <View
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 14,
                        overflow: 'hidden',
                        marginRight: 12,
                      }}
                    >
                      <LinearGradient
                        colors={['#EFF6FF', '#DBEAFE']}
                        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Pill size={20} color={colors.primary} />
                      </LinearGradient>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[typography.subhead, { color: colors.text }]}
                        numberOfLines={2}
                      >
                        {drug.name}
                      </Text>
                      <Text
                        style={[
                          typography.caption,
                          { color: colors.textMuted },
                        ]}
                      >
                        RxCUI: {drug.rxcui} · {drug.tty}
                      </Text>
                    </View>
                    <ChevronRight size={18} color={colors.textMuted} />
                  </View>
                </Card>
              </AnimatedPressable>
            ))}
          </View>
        )}

        {/* Empty search state with spelling suggestions */}
        {search.trim().length >= 2 &&
          displayDrugs.length === 0 &&
          !isSearching && (
            <View>
              <EmptyState
                icon={<Pill size={36} color={colors.textMuted} />}
                title="No medications found"
                subtitle={
                  suggestions.length > 0
                    ? 'Did you mean:'
                    : 'Try a different search term'
                }
              />
              {suggestions.length > 0 && (
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: 8,
                    marginTop: 12,
                    justifyContent: 'center',
                  }}
                >
                  {suggestions.map((s, i) => (
                    <AnimatedPressable
                      key={i}
                      onPress={() => setSearch(s)}
                      hapticType="light"
                      style={{
                        backgroundColor: colors.primaryLight,
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: radius.full,
                      }}
                    >
                      <Text
                        style={[
                          typography.footnote,
                          { color: colors.primary, fontWeight: '600' },
                        ]}
                      >
                        {s}
                      </Text>
                    </AnimatedPressable>
                  ))}
                </View>
              )}
            </View>
          )}

        {/* Common medications quick access */}
        {!selectedDrug && search.trim().length < 2 && (
          <View>
            <Text
              style={[
                typography.caption,
                { color: colors.textTertiary, marginBottom: 12 },
              ]}
            >
              COMMON AGED CARE MEDICATIONS
            </Text>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              {COMMON_MEDICATIONS.map((med) => (
                <AnimatedPressable
                  key={med.rxcui}
                  onPress={() => {
                    setSearch(med.name.split(' ')[0]);
                    setSelectedDrug({
                      rxcui: med.rxcui,
                      name: med.name,
                      tty: 'IN',
                    });
                  }}
                  hapticType="selection"
                  style={{
                    backgroundColor: colors.surface,
                    borderWidth: 1.5,
                    borderColor: colors.primaryBorder,
                    borderRadius: radius.full,
                    paddingHorizontal: 16,
                    paddingVertical: 11,
                    ...shadows.sm,
                  }}
                >
                  <Text style={[typography.footnote, { color: colors.text }]}>
                    {med.name}
                  </Text>
                </AnimatedPressable>
              ))}
            </View>

            {/* Data source info */}
            <Card style={{ marginTop: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <Info
                  size={18}
                  color={colors.primary}
                  style={{ marginTop: 2 }}
                />
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={[typography.subhead, { color: colors.text }]}>
                    Data Sources
                  </Text>
                  <Text
                    style={[
                      typography.footnote,
                      {
                        color: colors.textTertiary,
                        marginTop: 4,
                        lineHeight: 20,
                      },
                    ]}
                  >
                    Drug search & identification via NLM RxNorm API.{'\n'}
                    Adverse event data from US FDA OpenFDA database.{'\n'}
                    Australian terminology via CSIRO Ontoserver (SNOMED CT-AU).
                  </Text>
                </View>
              </View>
            </Card>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
