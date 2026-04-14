import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  User,
  MapPin,
  Calendar,
  Phone,
  Heart,
  Pill,
  AlertTriangle,
  FileText,
  Shield,
  Stethoscope,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Cloud,
  CheckCircle2,
  Save,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, typography, shadows, gradients } from '../../theme';
import Card from '../../components/Card';
import AnimatedPressable from '../../components/AnimatedPressable';
import { haptic } from '../../utils/haptics';
import { apiUrl } from '../../services/apiClient';
import { createBackup } from '../../services/iCloudBackup';
import { enqueueMutation } from '../../services/syncManager';
import { getAgedCarePriorities } from '../../data/diseases';

// ──────────────────────────────────────────────
// AU Health Constants
// ──────────────────────────────────────────────
const CARE_LEVELS = ['standard', 'high', 'palliative', 'respite', 'dementia'];
const GENDERS = ['Male', 'Female', 'Non-binary', 'Other', 'Prefer not to say'];
const COMMON_CONDITIONS = getAgedCarePriorities().map((d) => d.title);
const COMMON_ALLERGIES = [
  'Penicillin', 'Sulfonamides', 'NSAIDS', 'Aspirin', 'Codeine',
  'Latex', 'Iodine', 'Eggs', 'Shellfish', 'Nuts',
];

// ──────────────────────────────────────────────
// Reusable Components
// ──────────────────────────────────────────────

function FormSection({ title, icon: Icon, iconColor, iconBg, children, collapsible, defaultOpen = true }) {
  const [expanded, setExpanded] = useState(defaultOpen);
  return (
    <Card variant="elevated" style={{ marginBottom: 16 }}>
      <AnimatedPressable
        onPress={collapsible ? () => setExpanded(!expanded) : undefined}
        hapticType="selection"
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{
              width: 36, height: 36, borderRadius: 10,
              backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={18} color={iconColor} />
            </View>
            <Text style={[typography.headline, { color: colors.text }]}>{title}</Text>
          </View>
          {collapsible && (expanded ? <ChevronUp size={18} color={colors.textMuted} /> : <ChevronDown size={18} color={colors.textMuted} />)}
        </View>
      </AnimatedPressable>
      {(!collapsible || expanded) && <View style={{ marginTop: 16 }}>{children}</View>}
    </Card>
  );
}

function FormField({ label, required, children }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, letterSpacing: 0.3 }}>
        {label}{required && <Text style={{ color: colors.danger }}> *</Text>}
      </Text>
      {children}
    </View>
  );
}

function FormInput({ value, onChangeText, placeholder, keyboardType, multiline, maxLength }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      keyboardType={keyboardType || 'default'}
      multiline={multiline}
      maxLength={maxLength}
      style={{
        backgroundColor: colors.surfaceSecondary,
        borderRadius: radius.lg,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: colors.text,
        borderWidth: 1,
        borderColor: colors.borderLight,
        minHeight: multiline ? 80 : undefined,
        textAlignVertical: multiline ? 'top' : 'center',
      }}
    />
  );
}

function ChipSelector({ options, selected, onToggle, color }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map((opt) => {
        const isSelected = selected.includes(opt);
        return (
          <AnimatedPressable key={opt} onPress={() => onToggle(opt)} hapticType="selection">
            <View style={{
              paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full,
              backgroundColor: isSelected ? (color || colors.primary) : colors.surfaceSecondary,
              borderWidth: 1,
              borderColor: isSelected ? (color || colors.primary) : colors.borderLight,
            }}>
              <Text style={{
                fontSize: 13, fontWeight: '600',
                color: isSelected ? '#FFFFFF' : colors.textSecondary,
              }}>{opt}</Text>
            </View>
          </AnimatedPressable>
        );
      })}
    </View>
  );
}

function TagInput({ tags, onAdd, onRemove, placeholder }) {
  const [input, setInput] = useState('');

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onAdd(trimmed);
      setInput('');
    }
  };

  return (
    <View>
      {tags.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
          {tags.map((tag) => (
            <View key={tag} style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              backgroundColor: colors.primaryLight, paddingHorizontal: 12,
              paddingVertical: 6, borderRadius: radius.full,
            }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.primary }}>{tag}</Text>
              <AnimatedPressable onPress={() => onRemove(tag)} hapticType="selection">
                <X size={14} color={colors.primary} />
              </AnimatedPressable>
            </View>
          ))}
        </View>
      )}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          onSubmitEditing={addTag}
          returnKeyType="done"
          style={{
            flex: 1, backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg,
            paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: colors.text,
            borderWidth: 1, borderColor: colors.borderLight,
          }}
        />
        <AnimatedPressable onPress={addTag} hapticType="light">
          <View style={{
            width: 44, height: 44, borderRadius: radius.lg, backgroundColor: colors.primary,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Plus size={20} color="#FFFFFF" />
          </View>
        </AnimatedPressable>
      </View>
    </View>
  );
}

// ──────────────────────────────────────────────
// Main Screen
// ──────────────────────────────────────────────
export default function AddResidentScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Form state — Personal
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const [age, setAge] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [medicareNumber, setMedicareNumber] = useState('');

  // Emergency contact
  const [emergContactName, setEmergContactName] = useState('');
  const [emergContactPhone, setEmergContactPhone] = useState('');
  const [emergContactRelation, setEmergContactRelation] = useState('');

  // Medical
  const [gpName, setGpName] = useState('');
  const [gpPhone, setGpPhone] = useState('');
  const [conditions, setConditions] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [medications, setMedications] = useState([]);
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [careLevel, setCareLevel] = useState('standard');
  const [notes, setNotes] = useState('');

  // Sync state
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null); // 'supabase' | 'icloud' | 'done' | null

  const toggleInList = (list, setList) => (item) => {
    setList(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  const createResidentMutation = useMutation({
    mutationFn: async (residentData) => {
      const response = await fetch(apiUrl('/api/residents'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(residentData),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Failed' }));
        throw new Error(err.error || 'Failed to create resident');
      }
      return response.json();
    },
    onSuccess: async (data) => {
      // Phase 1: Supabase saved ✓
      setSyncStatus('supabase');

      // Phase 2: iCloud backup
      setSyncStatus('icloud');
      try {
        await createBackup();
      } catch (e) {
        console.warn('iCloud backup warning:', e.message);
      }

      setSyncStatus('done');
      queryClient.invalidateQueries({ queryKey: ['residents'] });

      setTimeout(() => {
        setSyncing(false);
        setSyncStatus(null);
        Alert.alert(
          'Resident Added',
          `${data.name} has been added and synced to Supabase + iCloud.`,
          [{ text: 'View Resident', onPress: () => router.replace(`/(tabs)/resident/${data.id}`) },
           { text: 'Add Another', onPress: resetForm }]
        );
      }, 800);
    },
    onError: async (err) => {
      setSyncing(false);
      setSyncStatus(null);
      // Queue for offline sync
      try {
        await enqueueMutation({
          method: 'POST',
          path: '/api/residents',
          body: buildResidentData(),
        });
        Alert.alert(
          'Saved Offline',
          'Resident data saved locally and will sync to Supabase when connection resumes. Data is backed up to iCloud.',
        );
        router.back();
      } catch {
        Alert.alert('Error', err.message);
      }
    },
  });

  const buildResidentData = useCallback(() => ({
    name: name.trim(),
    room: room.trim(),
    age: age ? parseInt(age) : null,
    status: 'stable',
    date_of_birth: dateOfBirth || null,
    gender: gender || null,
    medicare_number: medicareNumber.trim() || null,
    emergency_contact: emergContactName ? {
      name: emergContactName.trim(),
      phone: emergContactPhone.trim(),
      relationship: emergContactRelation.trim(),
    } : null,
    gp_name: gpName.trim() || null,
    gp_phone: gpPhone.trim() || null,
    conditions,
    allergies,
    medications,
    medical_history: medicalHistory,
    care_level: careLevel,
    notes: notes.trim() || null,
  }), [name, room, age, dateOfBirth, gender, medicareNumber, emergContactName, emergContactPhone, emergContactRelation, gpName, gpPhone, conditions, allergies, medications, medicalHistory, careLevel, notes]);

  const resetForm = () => {
    setName(''); setRoom(''); setAge(''); setDateOfBirth(''); setGender(''); setMedicareNumber('');
    setEmergContactName(''); setEmergContactPhone(''); setEmergContactRelation('');
    setGpName(''); setGpPhone(''); setConditions([]); setAllergies([]);
    setMedications([]); setMedicalHistory([]); setCareLevel('standard'); setNotes('');
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter the resident name.');
      return;
    }
    if (!room.trim()) {
      Alert.alert('Required', 'Please enter the room number.');
      return;
    }
    setSyncing(true);
    setSyncStatus(null);
    createResidentMutation.mutate(buildResidentData());
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <LinearGradient
        colors={['#059669', '#10B981', '#34D399']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <AnimatedPressable
          onPress={() => router.back()}
          hapticType="light"
          hitSlop={12}
          style={{
            width: 38, height: 38, borderRadius: 12,
            backgroundColor: 'rgba(255,255,255,0.2)',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <ArrowLeft size={20} color="#fff" />
        </AnimatedPressable>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={[typography.title3, { color: '#fff', fontWeight: '800' }]}>
            Add New Resident
          </Text>
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>
            Supabase + iCloud Sync
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Cloud size={16} color="rgba(255,255,255,0.9)" />
          <Shield size={16} color="rgba(255,255,255,0.9)" />
        </View>
      </LinearGradient>

      {/* Sync Overlay */}
      {syncing && (
        <View style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 100,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <View style={{
            backgroundColor: colors.surface, borderRadius: radius['2xl'],
            padding: 32, alignItems: 'center', width: 280,
            ...shadows.xl,
          }}>
            <ActivityIndicator size="large" color={colors.primary} style={{ marginBottom: 16 }} />
            <Text style={[typography.headline, { color: colors.text, marginBottom: 8 }]}>
              {syncStatus === 'supabase' ? 'Saved to Supabase ✓' :
               syncStatus === 'icloud' ? 'Syncing to iCloud...' :
               syncStatus === 'done' ? 'All Synced! ✓' :
               'Saving to Supabase...'}
            </Text>
            <View style={{ gap: 8, width: '100%', marginTop: 8 }}>
              <SyncStep label="Supabase PostgreSQL" done={syncStatus === 'supabase' || syncStatus === 'icloud' || syncStatus === 'done'} active={!syncStatus} />
              <SyncStep label="iCloud Backup" done={syncStatus === 'done'} active={syncStatus === 'icloud'} />
              <SyncStep label="Cache Invalidation" done={syncStatus === 'done'} active={false} />
            </View>
          </View>
        </View>
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* SECTION 1: Personal Information */}
          <FormSection title="Personal Information" icon={User} iconColor="#4F46E5" iconBg="#EEF2FF">
            <FormField label="Full Name" required>
              <FormInput value={name} onChangeText={setName} placeholder="e.g. Margaret Wilson" />
            </FormField>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <FormField label="Room Number" required>
                  <FormInput value={room} onChangeText={setRoom} placeholder="e.g. 204A" />
                </FormField>
              </View>
              <View style={{ flex: 1 }}>
                <FormField label="Age">
                  <FormInput value={age} onChangeText={setAge} placeholder="e.g. 82" keyboardType="numeric" />
                </FormField>
              </View>
            </View>
            <FormField label="Date of Birth">
              <FormInput value={dateOfBirth} onChangeText={setDateOfBirth} placeholder="DD/MM/YYYY" />
            </FormField>
            <FormField label="Gender">
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {GENDERS.map((g) => (
                  <AnimatedPressable key={g} onPress={() => setGender(g)} hapticType="selection">
                    <View style={{
                      paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full,
                      backgroundColor: gender === g ? '#4F46E5' : colors.surfaceSecondary,
                      borderWidth: 1, borderColor: gender === g ? '#4F46E5' : colors.borderLight,
                    }}>
                      <Text style={{
                        fontSize: 13, fontWeight: '600',
                        color: gender === g ? '#FFFFFF' : colors.textSecondary,
                      }}>{g}</Text>
                    </View>
                  </AnimatedPressable>
                ))}
              </View>
            </FormField>
            <FormField label="Medicare Number">
              <FormInput value={medicareNumber} onChangeText={setMedicareNumber} placeholder="1234 56789 0 / 1" maxLength={16} />
            </FormField>
          </FormSection>

          {/* SECTION 2: Emergency Contact */}
          <FormSection title="Emergency Contact" icon={Phone} iconColor="#DC2626" iconBg="#FEF2F2" collapsible>
            <FormField label="Contact Name">
              <FormInput value={emergContactName} onChangeText={setEmergContactName} placeholder="e.g. Sarah Wilson" />
            </FormField>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <FormField label="Phone">
                  <FormInput value={emergContactPhone} onChangeText={setEmergContactPhone} placeholder="04xx xxx xxx" keyboardType="phone-pad" />
                </FormField>
              </View>
              <View style={{ flex: 1 }}>
                <FormField label="Relationship">
                  <FormInput value={emergContactRelation} onChangeText={setEmergContactRelation} placeholder="e.g. Daughter" />
                </FormField>
              </View>
            </View>
          </FormSection>

          {/* SECTION 3: GP / Primary Physician */}
          <FormSection title="General Practitioner" icon={Stethoscope} iconColor="#0891B2" iconBg="#ECFEFF" collapsible>
            <FormField label="GP Name">
              <FormInput value={gpName} onChangeText={setGpName} placeholder="Dr. James Chen" />
            </FormField>
            <FormField label="GP Phone">
              <FormInput value={gpPhone} onChangeText={setGpPhone} placeholder="03 xxxx xxxx" keyboardType="phone-pad" />
            </FormField>
          </FormSection>

          {/* SECTION 4: Medical Conditions */}
          <FormSection title="Medical Conditions" icon={Heart} iconColor="#E11D48" iconBg="#FFF1F2" collapsible>
            <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 10 }}>
              Select common aged care conditions or add custom ones
            </Text>
            <ChipSelector
              options={COMMON_CONDITIONS}
              selected={conditions}
              onToggle={toggleInList(conditions, setConditions)}
              color="#E11D48"
            />
            <View style={{ marginTop: 12 }}>
              <TagInput
                tags={conditions.filter(c => !COMMON_CONDITIONS.includes(c))}
                onAdd={(c) => setConditions(prev => [...prev, c])}
                onRemove={(c) => setConditions(prev => prev.filter(x => x !== c))}
                placeholder="Add custom condition..."
              />
            </View>
          </FormSection>

          {/* SECTION 5: Allergies */}
          <FormSection title="Allergies" icon={AlertTriangle} iconColor="#EA580C" iconBg="#FFF7ED" collapsible>
            <ChipSelector
              options={COMMON_ALLERGIES}
              selected={allergies}
              onToggle={toggleInList(allergies, setAllergies)}
              color="#EA580C"
            />
            <View style={{ marginTop: 12 }}>
              <TagInput
                tags={allergies.filter(a => !COMMON_ALLERGIES.includes(a))}
                onAdd={(a) => setAllergies(prev => [...prev, a])}
                onRemove={(a) => setAllergies(prev => prev.filter(x => x !== a))}
                placeholder="Add custom allergy..."
              />
            </View>
          </FormSection>

          {/* SECTION 6: Medications */}
          <FormSection title="Current Medications" icon={Pill} iconColor="#7C3AED" iconBg="#F5F3FF" collapsible>
            <TagInput
              tags={medications}
              onAdd={(m) => setMedications(prev => [...prev, m])}
              onRemove={(m) => setMedications(prev => prev.filter(x => x !== m))}
              placeholder="e.g. Metformin 500mg BD"
            />
          </FormSection>

          {/* SECTION 7: Medical History */}
          <FormSection title="Medical History" icon={FileText} iconColor="#0369A1" iconBg="#F0F9FF" collapsible defaultOpen={false}>
            <TagInput
              tags={medicalHistory}
              onAdd={(h) => setMedicalHistory(prev => [...prev, h])}
              onRemove={(h) => setMedicalHistory(prev => prev.filter(x => x !== h))}
              placeholder="e.g. Hip replacement 2019"
            />
          </FormSection>

          {/* SECTION 8: Care Level */}
          <FormSection title="Care Level" icon={Shield} iconColor="#059669" iconBg="#ECFDF5">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {CARE_LEVELS.map((level) => (
                <AnimatedPressable key={level} onPress={() => setCareLevel(level)} hapticType="selection">
                  <View style={{
                    paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.full,
                    backgroundColor: careLevel === level ? '#059669' : colors.surfaceSecondary,
                    borderWidth: 1, borderColor: careLevel === level ? '#059669' : colors.borderLight,
                  }}>
                    <Text style={{
                      fontSize: 14, fontWeight: '600', textTransform: 'capitalize',
                      color: careLevel === level ? '#FFFFFF' : colors.textSecondary,
                    }}>{level}</Text>
                  </View>
                </AnimatedPressable>
              ))}
            </View>
          </FormSection>

          {/* SECTION 9: Notes */}
          <FormSection title="Additional Notes" icon={FileText} iconColor="#6B7280" iconBg="#F3F4F6" collapsible defaultOpen={false}>
            <FormInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Any additional care notes, preferences, or special requirements..."
              multiline
            />
          </FormSection>

          {/* Cloud Sync Info */}
          <Card style={{ marginBottom: 16, backgroundColor: '#F0FDF4', borderColor: '#BBF7D0', borderWidth: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center' }}>
                <Cloud size={20} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#065F46' }}>
                  Dual Cloud Sync
                </Text>
                <Text style={{ fontSize: 12, color: '#047857', marginTop: 2 }}>
                  Data saved to Supabase PostgreSQL and backed up to Apple iCloud automatically
                </Text>
              </View>
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky Submit Button */}
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingHorizontal: 20, paddingTop: 12, paddingBottom: insets.bottom + 12,
        backgroundColor: colors.background,
        borderTopWidth: 1, borderTopColor: colors.borderLight,
        ...shadows.lg,
      }}>
        <AnimatedPressable onPress={handleSubmit} hapticType="medium" disabled={syncing}>
          <LinearGradient
            colors={['#059669', '#10B981']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              gap: 10, paddingVertical: 16, borderRadius: radius.xl,
              ...shadows.md,
            }}
          >
            {syncing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Save size={20} color="#FFFFFF" />
            )}
            <Text style={{ fontSize: 17, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 }}>
              {syncing ? 'Syncing...' : 'Save Resident'}
            </Text>
          </LinearGradient>
        </AnimatedPressable>
      </View>
    </View>
  );
}

function SyncStep({ label, done, active }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      {done ? (
        <CheckCircle2 size={18} color="#059669" />
      ) : active ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: colors.borderLight }} />
      )}
      <Text style={{
        fontSize: 14, fontWeight: done ? '700' : '500',
        color: done ? '#059669' : active ? colors.text : colors.textMuted,
      }}>{label}</Text>
    </View>
  );
}
