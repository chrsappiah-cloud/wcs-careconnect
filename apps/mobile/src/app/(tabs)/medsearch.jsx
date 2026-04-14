import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Stethoscope,
  BookOpen,
  Microscope,
  Heart,
  ChevronRight,
  X,
  Info,
  Database,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadows, typography, gradients } from '../../theme';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import AnimatedPressable from '../../components/AnimatedPressable';
import {
  searchConditions,
  searchSNOMEDFindings,
  searchAMTMedications,
  searchFHIRPatients,
  lookupSNOMED,
  AGED_CARE_CONDITIONS,
  DISEASE_CATEGORIES,
  searchDiseases,
  getDiseasesByCategory,
} from '../../services/auMedApi';

const TABS = [
  { key: 'conditions', label: 'Conditions', icon: Stethoscope },
  { key: 'snomed', label: 'SNOMED CT-AU', icon: Microscope },
  { key: 'amt', label: 'AU Medicines', icon: Heart },
  { key: 'fhir', label: 'FHIR Data', icon: Database },
];

export default function MedSearchScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('conditions');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Local disease database search (instant, no network)
  const localResults = activeTab === 'conditions' && search.trim().length >= 2
    ? searchDiseases(search, { category: selectedCategory, limit: 30 })
    : [];

  // WHO ICD-11 condition search (network — augments local results)
  const { data: icdResults = [], isFetching: icdLoading } = useQuery({
    queryKey: ['icd11', search],
    queryFn: () => searchConditions(search),
    enabled: activeTab === 'conditions' && search.trim().length >= 2,
    staleTime: 120000,
    placeholderData: (prev) => prev,
  });

  // CSIRO Ontoserver — SNOMED CT-AU clinical findings
  const { data: snomedResults = [], isFetching: snomedLoading } = useQuery({
    queryKey: ['snomedFindings', search],
    queryFn: () => searchSNOMEDFindings(search),
    enabled: activeTab === 'snomed' && search.trim().length >= 2,
    staleTime: 120000,
    placeholderData: (prev) => prev,
  });

  // CSIRO Ontoserver — Australian Medicines Terminology (AMT)
  const { data: amtResults = [], isFetching: amtLoading } = useQuery({
    queryKey: ['amtMedications', search],
    queryFn: () => searchAMTMedications(search),
    enabled: activeTab === 'amt' && search.trim().length >= 2,
    staleTime: 120000,
    placeholderData: (prev) => prev,
  });

  // HAPI FHIR R4 patients/observations
  const { data: fhirResults = [], isFetching: fhirLoading } = useQuery({
    queryKey: ['fhirPatients', search],
    queryFn: () => searchFHIRPatients(search),
    enabled: activeTab === 'fhir' && search.trim().length >= 2,
    staleTime: 120000,
    placeholderData: (prev) => prev,
  });

  const isLoading =
    (activeTab === 'conditions' && icdLoading) ||
    (activeTab === 'snomed' && snomedLoading) ||
    (activeTab === 'amt' && amtLoading) ||
    (activeTab === 'fhir' && fhirLoading);

  const [detailModal, setDetailModal] = useState(null);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
    >
      {/* Header */}
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
          Medical Search
        </Text>
        <Text
          style={[
            typography.footnote,
            { color: 'rgba(255,255,255,0.7)', marginTop: 4 },
          ]}
        >
          WHO ICD-11 · SNOMED CT-AU · AMT · FHIR R4
        </Text>
      </LinearGradient>

      {/* Tab bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          gap: 8,
        }}
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          const Icon = tab.icon;
          return (
            <AnimatedPressable
              key={tab.key}
              onPress={() => {
                setActiveTab(tab.key);
                setSearch('');
              }}
              hapticType="selection"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderRadius: radius.full,
                paddingHorizontal: 16,
                paddingVertical: 10,
                overflow: 'hidden',
                ...(active
                  ? shadows.colored(colors.primary)
                  : { borderWidth: 1, borderColor: colors.surfaceBorder, backgroundColor: colors.surface, ...shadows.sm }),
              }}
            >
              {active && (
                <LinearGradient
                  colors={gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                />
              )}
              <Icon
                size={16}
                color={active ? colors.textInverse : colors.textTertiary}
              />
              <Text
                style={[
                  typography.caption,
                  {
                    color: active ? colors.textInverse : colors.textSecondary,
                    marginLeft: 6,
                    fontWeight: active ? '700' : '500',
                  },
                ]}
              >
                {tab.label}
              </Text>
            </AnimatedPressable>
          );
        })}
      </ScrollView>

      {/* Search bar */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
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
            placeholder={
              activeTab === 'conditions'
                ? 'Search conditions (e.g. Diabetes)'
                : activeTab === 'snomed'
                  ? 'Search SNOMED CT-AU findings'
                  : activeTab === 'amt'
                    ? 'Search Australian medicines'
                    : 'Search FHIR patients by name'
            }
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {isLoading && (
            <ActivityIndicator size="small" color={colors.primary} />
          )}
          {search.length > 0 && (
            <AnimatedPressable onPress={() => setSearch('')} hapticType="light">
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
        {/* ====== CONDITION RESULTS (ICD-11) ====== */}
        {activeTab === 'conditions' && search.trim().length >= 2 && (
          <View>
            {/* Instant local database results */}
            {localResults.length > 0 && (
              <>
                <Text
                  style={[
                    typography.caption,
                    { color: colors.textTertiary, marginBottom: 8 },
                  ]}
                >
                  LOCAL DATABASE — {localResults.length} found
                </Text>
                {localResults.map((item, i) => (
                  <AnimatedPressable
                    key={`local-${item.icd11 || i}`}
                    onPress={() => {
                      setDetailModal({
                        type: 'icd11',
                        title: item.title,
                        code: item.icd11,
                        snomed: item.snomed,
                        category: item.category,
                      });
                    }}
                    hapticType="selection"
                  >
                    <Card style={{ marginBottom: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
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
                            colors={['#F0FFF4', '#C6F6D5']}
                            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Stethoscope size={18} color={colors.success} />
                          </LinearGradient>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[typography.subhead, { color: colors.text }]}>
                            {item.title}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6, flexWrap: 'wrap' }}>
                            {item.icd11 && (
                              <View style={{ backgroundColor: colors.primaryLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.sm }}>
                                <Text style={[typography.caption, { color: colors.primary }]}>ICD-11: {item.icd11}</Text>
                              </View>
                            )}
                            {item.snomed && (
                              <View style={{ backgroundColor: colors.successLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.sm }}>
                                <Text style={[typography.caption, { color: colors.success }]}>SNOMED: {item.snomed}</Text>
                              </View>
                            )}
                            <Text style={[typography.caption, { color: colors.textMuted }]}>{item.category}</Text>
                          </View>
                        </View>
                      </View>
                    </Card>
                  </AnimatedPressable>
                ))}
              </>
            )}

            {/* WHO ICD-11 API results */}
            {icdResults.length > 0 && (
              <Text
                style={[
                  typography.caption,
                  { color: colors.textTertiary, marginBottom: 8, marginTop: localResults.length > 0 ? 16 : 0 },
                ]}
              >
                ICD-11 RESULTS — {icdResults.length} found
              </Text>
            )}
            {icdResults.map((item, i) => (
              <AnimatedPressable
                key={item.id || i}
                onPress={() => {
                  setDetailModal({
                    type: 'icd11',
                    title: item.title,
                    code: item.code,
                    score: item.score,
                  });
                }}
                hapticType="selection"
              >
              <Card style={{ marginBottom: 8 }}>
                <View
                  style={{ flexDirection: 'row', alignItems: 'flex-start' }}
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
                      colors={['#F5F3FF', '#EDE9FE']}
                      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <BookOpen size={18} color={colors.vitals.bp.color} />
                    </LinearGradient>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.subhead, { color: colors.text }]}>
                      {item.title}
                    </Text>
                    {item.code && (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          marginTop: 4,
                          gap: 8,
                        }}
                      >
                        <View
                          style={{
                            backgroundColor: colors.primaryLight,
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: radius.sm,
                          }}
                        >
                          <Text
                            style={[
                              typography.caption,
                              { color: colors.primary },
                            ]}
                          >
                            {item.code}
                          </Text>
                        </View>
                        {item.score != null && (
                          <Text
                            style={[
                              typography.caption,
                              { color: colors.textMuted },
                            ]}
                          >
                            Score: {item.score.toFixed(1)}
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              </Card>
              </AnimatedPressable>
            ))}
            {icdResults.length === 0 && localResults.length === 0 && !icdLoading && (
              <EmptyState
                icon={<Stethoscope size={36} color={colors.textMuted} />}
                title="No conditions found"
                subtitle="Try a different search term"
              />
            )}
          </View>
        )}

        {/* ====== SNOMED CT-AU RESULTS ====== */}
        {activeTab === 'snomed' && search.trim().length >= 2 && (
          <View>
            {snomedResults.length > 0 && (
              <Text
                style={[
                  typography.caption,
                  { color: colors.textTertiary, marginBottom: 8 },
                ]}
              >
                SNOMED CT-AU — {snomedResults.length} findings
              </Text>
            )}
            {snomedResults.map((item, i) => (
              <AnimatedPressable
                key={item.code || i}
                onPress={async () => {
                  setDetailModal({
                    type: 'snomed',
                    title: item.display,
                    code: item.code,
                    loading: true,
                  });
                  try {
                    const detail = await lookupSNOMED(item.code);
                    setDetailModal({
                      type: 'snomed',
                      title: item.display,
                      code: item.code,
                      detail,
                      loading: false,
                    });
                  } catch {
                    setDetailModal({
                      type: 'snomed',
                      title: item.display,
                      code: item.code,
                      loading: false,
                    });
                  }
                }}
              >
                <Card style={{ marginBottom: 8 }}>
                  <View
                    style={{ flexDirection: 'row', alignItems: 'flex-start' }}
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
                        colors={['#DCFCE7', '#BBF7D0']}
                        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Microscope size={18} color={colors.success} />
                      </LinearGradient>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[typography.subhead, { color: colors.text }]}
                      >
                        {item.display}
                      </Text>
                      <View
                        style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}
                      >
                        <View
                          style={{
                            backgroundColor: colors.surfaceSecondary,
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: radius.sm,
                          }}
                        >
                          <Text
                            style={[
                              typography.caption,
                              { color: colors.textTertiary },
                            ]}
                          >
                            SCTID: {item.code}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </Card>
              </AnimatedPressable>
            ))}
            {!snomedLoading && snomedResults.length === 0 && (
              <EmptyState
                icon={<Microscope size={36} color={colors.textMuted} />}
                title="No SNOMED findings matched"
                subtitle="Try searching for a clinical term"
              />
            )}
          </View>
        )}

        {/* ====== AMT RESULTS ====== */}
        {activeTab === 'amt' && search.trim().length >= 2 && (
          <View>
            {amtResults.length > 0 && (
              <Text
                style={[
                  typography.caption,
                  { color: colors.textTertiary, marginBottom: 8 },
                ]}
              >
                AUSTRALIAN MEDICINES — {amtResults.length} found
              </Text>
            )}
            {amtResults.map((item, i) => (
              <AnimatedPressable
                key={item.code || i}
                onPress={() => {
                  setDetailModal({
                    type: 'amt',
                    title: item.display,
                    code: item.code,
                  });
                }}
                hapticType="selection"
              >
              <Card style={{ marginBottom: 8 }}>
                <View
                  style={{ flexDirection: 'row', alignItems: 'flex-start' }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      overflow: 'hidden',
                      marginRight: 12,
                    }}
                  >
                    <LinearGradient
                      colors={['#FFF1F2', '#FEE2E2']}
                      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Heart size={18} color={colors.heart} />
                    </LinearGradient>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.subhead, { color: colors.text }]}>
                      {item.display}
                    </Text>
                    <View
                      style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}
                    >
                      <View
                        style={{
                          backgroundColor: colors.dangerLight,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: radius.sm,
                        }}
                      >
                        <Text
                          style={[
                            typography.caption,
                            { color: colors.dangerDark },
                          ]}
                        >
                          AMT: {item.code}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </Card>
              </AnimatedPressable>
            ))}
            {!amtLoading && amtResults.length === 0 && (
              <EmptyState
                icon={<Heart size={36} color={colors.textMuted} />}
                title="No AU medicines found"
                subtitle="Search by generic name or brand"
              />
            )}
          </View>
        )}

        {/* ====== FHIR PATIENTS ====== */}
        {activeTab === 'fhir' && search.trim().length >= 2 && (
          <View>
            {fhirResults.length > 0 && (
              <Text
                style={[
                  typography.caption,
                  { color: colors.textTertiary, marginBottom: 8 },
                ]}
              >
                FHIR R4 PATIENTS — {fhirResults.length} records
              </Text>
            )}
            {fhirResults.map((patient, i) => (
              <AnimatedPressable
                key={patient.id || i}
                onPress={() => {
                  setDetailModal({
                    type: 'fhir',
                    title: patient.name || 'Patient',
                    id: patient.id,
                    gender: patient.gender,
                    birthDate: patient.birthDate,
                  });
                }}
                hapticType="selection"
              >
                <Card style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: colors.primaryLight,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}
                    >
                      <Text
                        style={[
                          typography.subhead,
                          { color: colors.primary, fontWeight: '700' },
                        ]}
                      >
                        {patient.name?.charAt(0) || '?'}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[typography.subhead, { color: colors.text }]}
                      >
                        {patient.name}
                      </Text>
                      <View
                        style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}
                      >
                        {patient.gender && (
                          <Text
                            style={[
                              typography.caption,
                              { color: colors.textMuted },
                            ]}
                          >
                            {patient.gender}
                          </Text>
                        )}
                        {patient.birthDate && (
                          <Text
                            style={[
                              typography.caption,
                              { color: colors.textMuted },
                            ]}
                          >
                            DOB: {patient.birthDate}
                          </Text>
                        )}
                        <Text
                          style={[
                            typography.caption,
                            { color: colors.textMuted },
                          ]}
                        >
                          ID: {patient.id}
                        </Text>
                      </View>
                    </View>
                    <ChevronRight size={18} color={colors.textMuted} />
                  </View>
                </Card>
              </AnimatedPressable>
            ))}
            {!fhirLoading && fhirResults.length === 0 && (
              <EmptyState
                icon={<Database size={36} color={colors.textMuted} />}
                title="No FHIR patients found"
                subtitle="Search by patient name"
              />
            )}
          </View>
        )}

        {/* Default state — show aged care condition shortcuts */}
        {search.trim().length < 2 && (
          <View>
            <Text
              style={[
                typography.caption,
                { color: colors.textTertiary, marginBottom: 12 },
              ]}
            >
              {activeTab === 'conditions'
                ? (selectedCategory || 'BROWSE BY CATEGORY')
                : activeTab === 'snomed'
                  ? 'TAP A CONDITION TO SEARCH SNOMED CT-AU'
                  : activeTab === 'amt'
                    ? 'TAP A CONDITION TO FIND RELATED MEDICINES'
                    : 'ENTER A PATIENT NAME TO SEARCH FHIR R4'}
            </Text>

            {/* Category filter chips for conditions tab */}
            {activeTab === 'conditions' && (
              <View style={{ marginBottom: 16 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 8, paddingBottom: 4 }}>
                    <AnimatedPressable
                      onPress={() => setSelectedCategory(null)}
                      hapticType="selection"
                      style={{
                        backgroundColor: !selectedCategory ? colors.primary : colors.surface,
                        borderWidth: 1.5,
                        borderColor: !selectedCategory ? colors.primary : colors.primaryBorder,
                        borderRadius: radius.full,
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                      }}
                    >
                      <Text style={[typography.caption, { color: !selectedCategory ? '#fff' : colors.text, fontWeight: '600' }]}>
                        All
                      </Text>
                    </AnimatedPressable>
                    {DISEASE_CATEGORIES.map((cat) => (
                      <AnimatedPressable
                        key={cat}
                        onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                        hapticType="selection"
                        style={{
                          backgroundColor: selectedCategory === cat ? colors.primary : colors.surface,
                          borderWidth: 1.5,
                          borderColor: selectedCategory === cat ? colors.primary : colors.primaryBorder,
                          borderRadius: radius.full,
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                        }}
                      >
                        <Text style={[typography.caption, { color: selectedCategory === cat ? '#fff' : colors.text, fontWeight: '600' }]}>
                          {cat}
                        </Text>
                      </AnimatedPressable>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {activeTab !== 'fhir' && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {(activeTab === 'conditions'
                  ? (selectedCategory
                      ? getDiseasesByCategory(selectedCategory)
                      : AGED_CARE_CONDITIONS.map((c) => ({ title: c.display, snomed: c.code, icd11: c.icd11 }))
                    )
                  : AGED_CARE_CONDITIONS.map((c) => ({ title: c.display, snomed: c.code }))
                ).map((cond, idx) => (
                  <AnimatedPressable
                    key={cond.snomed || cond.icd11 || idx}
                    onPress={() => setSearch(cond.title || cond.display)}
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
                      {cond.title || cond.display}
                    </Text>
                    {cond.icd11 && (
                      <Text style={[typography.caption, { color: colors.textTertiary, fontSize: 10, marginTop: 2 }]}>
                        {cond.icd11}
                      </Text>
                    )}
                  </AnimatedPressable>
                ))}
              </View>
            )}

            {/* Data sources card */}
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
                    {activeTab === 'conditions'
                      ? 'Disease classification via WHO ICD-11 API (International Classification of Diseases, 11th Revision).'
                      : activeTab === 'snomed'
                        ? 'Clinical terminology via CSIRO Ontoserver — Australian edition of SNOMED CT (SNOMED CT-AU).'
                        : activeTab === 'amt'
                          ? 'Australian Medicines Terminology (AMT) via CSIRO Ontoserver FHIR endpoint.'
                          : 'Patient records from HAPI FHIR R4 public test server (hapi.fhir.org). This is a sandbox — data is synthetic.'}
                  </Text>
                </View>
              </View>
            </Card>
          </View>
        )}
      </ScrollView>

      {/* Detail Modal */}
      <Modal
        visible={!!detailModal}
        animationType="slide"
        transparent
        onRequestClose={() => setDetailModal(null)}
      >
        <AnimatedPressable
          onPress={() => setDetailModal(null)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 24,
              paddingBottom: insets.bottom + 24,
              maxHeight: '60%',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor:
                    detailModal?.type === 'snomed' ? colors.successLight
                    : detailModal?.type === 'icd11' ? '#F5F3FF'
                    : detailModal?.type === 'amt' ? '#FFF1F2'
                    : colors.primaryLight,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                {detailModal?.type === 'snomed' ? (
                  <Microscope size={20} color={colors.success} />
                ) : detailModal?.type === 'icd11' ? (
                  <BookOpen size={20} color={colors.vitals.bp.color} />
                ) : detailModal?.type === 'amt' ? (
                  <Heart size={20} color={colors.heart} />
                ) : (
                  <Database size={20} color={colors.primary} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[typography.headline, { color: colors.text }]}>
                  {detailModal?.title}
                </Text>
                <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 2 }]}>
                  {detailModal?.type === 'snomed' ? 'SNOMED CT-AU Finding'
                    : detailModal?.type === 'icd11' ? 'WHO ICD-11 Classification'
                    : detailModal?.type === 'amt' ? 'Australian Medicines Terminology'
                    : 'FHIR R4 Patient'}
                </Text>
              </View>
            </View>

            {detailModal?.loading && (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginBottom: 16 }} />
            )}

            {detailModal?.type === 'snomed' && (
              <View style={{ gap: 12 }}>
                <DetailRow label="SNOMED CT ID" value={detailModal.code} />
                {detailModal.detail?.display && (
                  <DetailRow label="Display Term" value={detailModal.detail.display} />
                )}
                {detailModal.detail?.codeSystem && (
                  <DetailRow label="Code System" value={detailModal.detail.codeSystem} />
                )}
                {detailModal.detail?.version && (
                  <DetailRow label="Version" value={detailModal.detail.version} />
                )}
              </View>
            )}

            {detailModal?.type === 'icd11' && (
              <View style={{ gap: 12 }}>
                <DetailRow label="ICD-11 Code" value={detailModal.code} />
                {detailModal.score != null && (
                  <DetailRow label="Match Score" value={detailModal.score.toFixed(1)} />
                )}
                <DetailRow label="Source" value="WHO ICD-11 API" />
              </View>
            )}

            {detailModal?.type === 'amt' && (
              <View style={{ gap: 12 }}>
                <DetailRow label="AMT Code" value={detailModal.code} />
                <DetailRow label="Source" value="CSIRO Ontoserver AMT" />
              </View>
            )}

            {detailModal?.type === 'fhir' && (
              <View style={{ gap: 12 }}>
                <DetailRow label="FHIR ID" value={detailModal.id} />
                {detailModal.gender && <DetailRow label="Gender" value={detailModal.gender} />}
                {detailModal.birthDate && <DetailRow label="Date of Birth" value={detailModal.birthDate} />}
                <DetailRow label="Source" value="HAPI FHIR R4 (Sandbox)" />
              </View>
            )}

            <AnimatedPressable
              onPress={() => setDetailModal(null)}
              hapticType="light"
              style={{
                marginTop: 24,
                borderRadius: radius.xl,
                overflow: 'hidden',
              }}
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
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textInverse }}>
                  Close
                </Text>
              </LinearGradient>
            </AnimatedPressable>
          </View>
        </AnimatedPressable>
      </Modal>
    </View>
  );
}

function DetailRow({ label, value }) {
  return (
    <View
      style={{
        backgroundColor: colors.surfaceSecondary,
        borderRadius: radius.lg,
        padding: 14,
      }}
    >
      <Text style={[typography.caption, { color: colors.textTertiary, marginBottom: 4 }]}>
        {label}
      </Text>
      <Text style={[typography.subhead, { color: colors.text }]} selectable>
        {value}
      </Text>
    </View>
  );
}
