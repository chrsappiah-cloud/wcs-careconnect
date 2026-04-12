import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
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
import { colors, radius, shadows, typography } from '../../theme';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import {
  searchConditions,
  searchSNOMEDFindings,
  searchAMTMedications,
  searchFHIRPatients,
  lookupSNOMED,
  AGED_CARE_CONDITIONS,
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

  // WHO ICD-11 condition search
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

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: insets.top,
      }}
    >
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 }}>
        <Text style={[typography.largeTitle, { color: colors.text }]}>
          Medical Search
        </Text>
        <Text
          style={[
            typography.footnote,
            { color: colors.textTertiary, marginTop: 2 },
          ]}
        >
          WHO ICD-11 · SNOMED CT-AU · AMT · FHIR R4
        </Text>
      </View>

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
            <TouchableOpacity
              key={tab.key}
              onPress={() => {
                setActiveTab(tab.key);
                setSearch('');
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: active ? colors.primary : colors.surface,
                borderRadius: radius.full,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderWidth: active ? 0 : 1,
                borderColor: colors.surfaceBorder,
                ...(!active ? shadows.sm : {}),
              }}
            >
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
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Search bar */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            paddingHorizontal: 14,
            height: 48,
            borderWidth: 1,
            borderColor: colors.surfaceBorder,
            ...shadows.sm,
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
            <TouchableOpacity onPress={() => setSearch('')}>
              <X size={18} color={colors.textMuted} />
            </TouchableOpacity>
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
            {icdResults.length > 0 && (
              <Text
                style={[
                  typography.caption,
                  { color: colors.textTertiary, marginBottom: 8 },
                ]}
              >
                ICD-11 RESULTS — {icdResults.length} found
              </Text>
            )}
            {icdResults.map((item, i) => (
              <Card key={item.id || i} style={{ marginBottom: 8 }}>
                <View
                  style={{ flexDirection: 'row', alignItems: 'flex-start' }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: colors.vitals.bp.bg,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}
                  >
                    <BookOpen size={18} color={colors.vitals.bp.color} />
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
            ))}
            {!icdLoading && icdResults.length === 0 && (
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
              <TouchableOpacity
                key={item.code || i}
                activeOpacity={0.7}
                onPress={async () => {
                  try {
                    const detail = await lookupSNOMED(item.code);
                    Alert.alert(
                      item.display,
                      [
                        `SNOMED CT ID: ${item.code}`,
                        detail?.display && `Display: ${detail.display}`,
                        detail?.codeSystem &&
                          `Code System: ${detail.codeSystem}`,
                      ]
                        .filter(Boolean)
                        .join('\n\n'),
                    );
                  } catch {
                    Alert.alert(item.display, `SNOMED CT ID: ${item.code}`);
                  }
                }}
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
                        backgroundColor: colors.successLight,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}
                    >
                      <Microscope size={18} color={colors.success} />
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
              </TouchableOpacity>
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
              <Card key={item.code || i} style={{ marginBottom: 8 }}>
                <View
                  style={{ flexDirection: 'row', alignItems: 'flex-start' }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: colors.heartBg,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}
                  >
                    <Heart size={18} color={colors.heart} />
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
              <TouchableOpacity
                key={patient.id || i}
                activeOpacity={0.7}
                onPress={() =>
                  Alert.alert(
                    patient.name || 'Patient',
                    [
                      patient.gender && `Gender: ${patient.gender}`,
                      patient.birthDate && `DOB: ${patient.birthDate}`,
                      `FHIR ID: ${patient.id}`,
                    ]
                      .filter(Boolean)
                      .join('\n'),
                  )
                }
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
              </TouchableOpacity>
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
                ? 'COMMON AGED CARE CONDITIONS'
                : activeTab === 'snomed'
                  ? 'TAP A CONDITION TO SEARCH SNOMED CT-AU'
                  : activeTab === 'amt'
                    ? 'TAP A CONDITION TO FIND RELATED MEDICINES'
                    : 'ENTER A PATIENT NAME TO SEARCH FHIR R4'}
            </Text>

            {activeTab !== 'fhir' && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {AGED_CARE_CONDITIONS.map((cond) => (
                  <TouchableOpacity
                    key={cond.code}
                    onPress={() => setSearch(cond.display)}
                    style={{
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.surfaceBorder,
                      borderRadius: radius.lg,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      ...shadows.sm,
                    }}
                  >
                    <Text style={[typography.footnote, { color: colors.text }]}>
                      {cond.display}
                    </Text>
                  </TouchableOpacity>
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
    </View>
  );
}
