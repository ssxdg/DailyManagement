import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Card, ChoiceRow, colors, DateField, Field, Page, Title } from '@/components/ui';
import { listCategories, listExpenses, newId, saveExpense } from '@/lib/database';
import { amountToCents, applyAmountKey, formatCents, localDay, type Category } from '@/lib/domain';

export default function ExpenseForm() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('0');
  const [day, setDay] = useState(localDay());
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    Promise.all([listCategories(), id ? listExpenses() : Promise.resolve([])]).then(([allCategories, expenses]) => {
      const existing = expenses.find(item => item.id === id);
      setCategories(allCategories);
      setCategoryId(existing?.categoryId ?? allCategories.find(item => item.isActive)?.id ?? '');
      if (existing) { setAmount(formatCents(existing.amountCents)); setDay(existing.occurredOn); setNote(existing.note); }
    }).catch(error => Alert.alert('读取失败', String(error)));
  }, [id]);
  async function save() {
    try {
      const amountCents = amountToCents(amount);
      if (!categoryId) throw new Error('请先选择支出分类');
      setSaving(true);
      await saveExpense({ id: id ?? newId(), categoryId, amountCents, occurredOn: day, note: note.trim() });
      router.back();
    } catch (error) { Alert.alert('保存失败', String(error)); }
    finally { setSaving(false); }
  }
  return <Page>
    <Title subtitle="金额区域使用页面键盘，不会唤起手机数字键盘。">{id ? '编辑支出' : '记一笔支出'}</Title>
    <Card><Text style={styles.label}>支出分类</Text><ChoiceRow options={categories.filter(item => item.isActive || item.id === categoryId).map(item => ({ label: item.name, value: item.id }))} value={categoryId} onChange={setCategoryId} /></Card>
    <Card><Text style={styles.label}>支出金额</Text><Text style={styles.amount}>¥ {amount}</Text><View style={styles.keypad}>{['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'backspace'].map(key => <Pressable accessibilityRole="button" accessibilityLabel={key === 'backspace' ? '退格' : key} key={key} style={styles.key} onPress={() => setAmount(current => applyAmountKey(current, key))}><Text style={styles.keyText}>{key === 'backspace' ? '⌫' : key}</Text></Pressable>)}</View><Pressable onPress={() => setAmount('0')}><Text style={styles.clear}>清空金额</Text></Pressable></Card>
    <DateField label="支出日期" value={day} onChange={setDay} />
    <Field label="备注（选填）" value={note} onChangeText={setNote} placeholder="这笔钱花在了哪里" maxLength={100} />
    <Button title={saving ? '保存中…' : '保存支出'} onPress={save} disabled={saving} />
  </Page>;
}

const styles = StyleSheet.create({ label: { color: colors.text, fontSize: 15, fontWeight: '700' }, amount: { color: colors.text, fontSize: 38, fontWeight: '700', textAlign: 'right', marginVertical: 12 }, keypad: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' }, key: { width: '31%', height: 58, borderRadius: 12, backgroundColor: '#F1F6F4', justifyContent: 'center', alignItems: 'center' }, keyText: { color: colors.text, fontSize: 24, fontWeight: '600' }, clear: { color: colors.muted, textAlign: 'right', paddingTop: 6, fontSize: 13 } });
