import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button, Card, ChoiceRow, colors, DateField, Field, Page, Title } from '@/components/ui';
import { listMeals, newId, saveMeal } from '@/lib/database';
import { localTimestamp, type MealItem } from '@/lib/domain';

export default function MealForm() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [at, setAt] = useState(localTimestamp());
  const [label, setLabel] = useState('');
  const [note, setNote] = useState('');
  const [items, setItems] = useState<MealItem[]>([{ name: '', quantity: '', unit: '' }]);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!id) return;
    listMeals().then(rows => {
      const item = rows.find(row => row.id === id);
      if (item) { setAt(item.occurredAt); setLabel(item.label); setNote(item.note); setItems(item.items); }
    }).catch(error => Alert.alert('读取失败', String(error)));
  }, [id]);
  function update(index: number, patch: Partial<MealItem>) { setItems(current => current.map((item, i) => i === index ? { ...item, ...patch } : item)); }
  async function save() {
    const cleaned = items.map(item => ({ name: item.name.trim(), quantity: item.quantity.trim(), unit: item.unit.trim() }));
    if (!cleaned.length || cleaned.some(item => !item.name || !item.quantity || !item.unit)) return Alert.alert('请填写每种食物的名称、数量和单位');
    try { setSaving(true); await saveMeal({ id: id ?? newId(), occurredAt: at, label, note: note.trim(), items: cleaned }); router.back(); }
    catch (error) { Alert.alert('保存失败', String(error)); }
    finally { setSaving(false); }
  }
  return <Page><Title subtitle="每次进食单独记录，餐次标签可以留空。">{id ? '编辑饮食' : '记录饮食'}</Title>
    <DateField label="进食时间" value={at} onChange={setAt} time />
    <Text style={styles.label}>餐次标签（选填）</Text>
    <ChoiceRow options={[{ label: '不标记', value: '' }, { label: '早餐', value: '早餐' }, { label: '午餐', value: '午餐' }, { label: '晚餐', value: '晚餐' }, { label: '加餐', value: '加餐' }]} value={label} onChange={setLabel} />
    {items.map((item, index) => <Card key={index}>
      <View style={styles.itemHead}><Text style={styles.label}>食物 {index + 1}</Text>{items.length > 1 ? <Text style={styles.remove} onPress={() => setItems(current => current.filter((_, i) => i !== index))}>移除</Text> : null}</View>
      <Field label="名称" value={item.name} onChangeText={name => update(index, { name })} placeholder="例如：米饭" maxLength={50} />
      <View style={styles.row}><View style={styles.quantity}><Field label="数量" value={item.quantity} onChangeText={quantity => update(index, { quantity })} keyboardType="decimal-pad" placeholder="例如：1" maxLength={12} /></View><View style={styles.quantity}><Field label="单位" value={item.unit} onChangeText={unit => update(index, { unit })} placeholder="碗 / 克 / 个" maxLength={12} /></View></View>
    </Card>)}
    <Button title="＋ 添加一种食物" secondary onPress={() => setItems(current => [...current, { name: '', quantity: '', unit: '' }])} />
    <Field label="备注（选填）" value={note} onChangeText={setNote} placeholder="用餐情况等" maxLength={200} />
    <Button title={saving ? '保存中…' : '保存饮食记录'} onPress={save} disabled={saving} />
  </Page>;
}

const styles = StyleSheet.create({ label: { color: colors.text, fontSize: 15, fontWeight: '700' }, itemHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, remove: { color: colors.red, fontSize: 14, fontWeight: '700' }, row: { flexDirection: 'row', gap: 10 }, quantity: { flex: 1 } });
