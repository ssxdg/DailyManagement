import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { localDay, localTimestamp } from '@/lib/domain';

export const colors = { background: '#F5F7F6', card: '#FFFFFF', text: '#18332F', muted: '#667B76', primary: '#087F69', border: '#DFE8E4', red: '#BA3B42', blue: '#3264B9' };

export function Page({ children }: { children: React.ReactNode }) {
  return <SafeAreaView style={styles.safe} edges={['bottom']}><ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">{children}</ScrollView></SafeAreaView>;
}

export function Title({ children, subtitle }: { children: React.ReactNode; subtitle?: string }) {
  return <View style={styles.titleBlock}><Text style={styles.title}>{children}</Text>{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}</View>;
}

export function Card({ children, onPress, accent }: { children: React.ReactNode; onPress?: () => void; accent?: string }) {
  return <Pressable onPress={onPress} disabled={!onPress} style={[styles.card, accent ? { borderLeftWidth: 4, borderLeftColor: accent } : null]}>{children}</Pressable>;
}

export function Button({ title, onPress, secondary, danger, disabled }: { title: string; onPress: () => void; secondary?: boolean; danger?: boolean; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.button, secondary && styles.secondaryButton, danger && styles.dangerButton, disabled && styles.disabled]}><Text style={[styles.buttonText, secondary && styles.secondaryButtonText]}>{title}</Text></Pressable>;
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput style={styles.input} placeholderTextColor="#8A9A96" {...props} /></View>;
}

export function ChoiceRow({ options, value, onChange }: { options: { label: string; value: string }[]; value: string; onChange: (value: string) => void }) {
  return <View style={styles.choices}>{options.map(option => <Pressable accessibilityRole="button" key={option.value} onPress={() => onChange(option.value)} style={[styles.choice, value === option.value && styles.choiceActive]}><Text style={[styles.choiceText, value === option.value && styles.choiceTextActive]}>{option.label}</Text></Pressable>)}</View>;
}

export function DateField({ label, value, onChange, time }: { label: string; value: string; onChange: (value: string) => void; time?: boolean }) {
  const [picker, setPicker] = useState<'date' | 'time' | null>(null);
  const date = time ? new Date(value) : new Date(`${value}T12:00:00`);
  function update(next: Date) { onChange(time ? localTimestamp(next) : localDay(next)); }
  return <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.dateRow}><Pressable style={styles.dateButton} onPress={() => setPicker('date')}><Text style={styles.dateText}>{value.slice(0, 10)}</Text></Pressable>{time ? <Pressable style={styles.dateButton} onPress={() => setPicker('time')}><Text style={styles.dateText}>{value.slice(11, 16)}</Text></Pressable> : null}</View>
    {picker ? <DateTimePicker value={Number.isNaN(date.getTime()) ? new Date() : date} mode={picker} display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(event, next) => {
      if (Platform.OS !== 'ios') setPicker(null);
      if (event.type === 'set' && next) update(next);
    }} /> : null}
    {picker && Platform.OS === 'ios' ? <Pressable onPress={() => setPicker(null)}><Text style={styles.done}>完成</Text></Pressable> : null}
  </View>;
}

export function Empty({ text }: { text: string }) { return <Text style={styles.empty}>{text}</Text>; }
export function SectionTitle({ children }: { children: React.ReactNode }) { return <Text style={styles.sectionTitle}>{children}</Text>; }

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  page: { padding: 20, paddingBottom: 40, gap: 16 },
  titleBlock: { gap: 5, marginBottom: 4 },
  title: { color: colors.text, fontSize: 27, fontWeight: '700' },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  card: { backgroundColor: colors.card, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 18, gap: 10 },
  button: { minHeight: 48, borderRadius: 14, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 },
  secondaryButton: { backgroundColor: '#E8F3EF' },
  dangerButton: { backgroundColor: colors.red },
  disabled: { opacity: 0.5 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  secondaryButtonText: { color: colors.primary },
  field: { gap: 8 },
  label: { color: colors.text, fontSize: 15, fontWeight: '600' },
  input: { minHeight: 48, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, fontSize: 16, color: colors.text },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { minHeight: 44, paddingHorizontal: 14, justifyContent: 'center', borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.border },
  choiceActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  choiceText: { color: colors.text, fontSize: 14 },
  choiceTextActive: { color: '#FFFFFF', fontWeight: '700' },
  dateRow: { flexDirection: 'row', gap: 8 },
  dateButton: { minHeight: 48, paddingHorizontal: 15, justifyContent: 'center', borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.border },
  dateText: { color: colors.text, fontSize: 16 },
  done: { color: colors.primary, textAlign: 'right', fontSize: 16, padding: 8 },
  empty: { color: colors.muted, textAlign: 'center', paddingVertical: 28, lineHeight: 22 },
  sectionTitle: { fontSize: 18, color: colors.text, fontWeight: '700', marginTop: 6 },
});
