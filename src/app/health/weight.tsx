import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { Button, DateField, Field, Page, Title } from '@/components/ui';
import { listWeights, newId, saveWeight } from '@/lib/database';
import { localTimestamp } from '@/lib/domain';

export default function WeightForm() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [at, setAt] = useState(localTimestamp());
  const [weight, setWeight] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!id) return;
    listWeights().then(rows => {
      const item = rows.find(row => row.id === id);
      if (item) { setAt(item.occurredAt); setWeight(String(item.weightKg)); setNote(item.note); }
    }).catch(error => Alert.alert('读取失败', String(error)));
  }, [id]);
  async function save() {
    const number = Number(weight);
    if (!Number.isFinite(number) || number <= 0 || number > 500) return Alert.alert('请输入有效体重（kg）');
    try { setSaving(true); await saveWeight({ id: id ?? newId(), occurredAt: at, weightKg: number, note: note.trim() }); router.back(); }
    catch (error) { Alert.alert('保存失败', String(error)); }
    finally { setSaving(false); }
  }
  return <Page><Title subtitle="一天可以称重多次，每次都会保留独立记录。">{id ? '编辑体重' : '记录体重'}</Title>
    <DateField label="称重时间" value={at} onChange={setAt} time />
    <Field label="体重（kg）" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="例如：65.5" maxLength={8} />
    <Field label="备注（选填）" value={note} onChangeText={setNote} placeholder="例如：晨起空腹" maxLength={100} />
    <Button title={saving ? '保存中…' : '保存体重记录'} onPress={save} disabled={saving} />
  </Page>;
}
