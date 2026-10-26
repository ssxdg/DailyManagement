import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import { Alert, Text } from 'react-native';

import { Button, Card, ChoiceRow, colors, Field, Page, SectionTitle, Title } from '@/components/ui';
import { createBackup, getSettings, restoreBackup, saveSettings } from '@/lib/database';
import type { Settings } from '@/lib/domain';
import { validateBackup } from '@/lib/export';

const weekOptions = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((label, index) => ({ label, value: String(index + 1) }));

export default function SettingsScreen() {
  const [settings, setSettings] = useState<Settings>({ weekStart: 1, monthStart: 1 });
  const [monthText, setMonthText] = useState('1');
  const [busy, setBusy] = useState(false);
  useEffect(() => { getSettings().then(value => { setSettings(value); setMonthText(String(value.monthStart)); }).catch(error => Alert.alert('读取失败', String(error))); }, []);
  async function save() {
    const monthStart = Number(monthText);
    if (!Number.isInteger(monthStart) || monthStart < 1 || monthStart > 31) return Alert.alert('请输入 1～31 的每月起始号');
    try { await saveSettings({ ...settings, monthStart }); setSettings(current => ({ ...current, monthStart })); Alert.alert('已保存', '统计周期已更新。'); }
    catch (error) { Alert.alert('保存失败', String(error)); }
  }
  async function backup() {
    try {
      setBusy(true);
      if (!await Sharing.isAvailableAsync()) throw new Error('当前设备不支持文件分享');
      const data = await createBackup();
      const file = new File(Paths.cache, `daily-management-backup-${new Date().toISOString().slice(0, 10)}.json`);
      file.create({ overwrite: true });
      await file.write(JSON.stringify(data, null, 2));
      await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: '保存数据备份' });
    } catch (error) { Alert.alert('备份失败', String(error)); }
    finally { setBusy(false); }
  }
  async function importBackup() {
    try {
      const picked = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
      if (picked.canceled) return;
      const raw = await new File(picked.assets[0].uri).text();
      const data = validateBackup(JSON.parse(raw));
      Alert.alert('确认恢复数据', `备份包含 ${data.expenses.length} 笔支出、${data.meals.length} 条饮食、${data.weights.length} 条体重记录。恢复会替换本机全部现有数据。`, [
        { text: '取消', style: 'cancel' },
        { text: '确认恢复', style: 'destructive', onPress: async () => {
          try { setBusy(true); await restoreBackup(data); setSettings(data.settings); setMonthText(String(data.settings.monthStart)); Alert.alert('恢复完成'); }
          catch (error) { Alert.alert('恢复失败', String(error)); }
          finally { setBusy(false); }
        } },
      ]);
    } catch (error) { Alert.alert('备份文件无效', String(error)); }
  }
  return <Page><Title subtitle="让统计周期适合你的记账习惯，并妥善保存本机数据。">设置与备份</Title>
    <SectionTitle>统计周期</SectionTitle>
    <Card><Text style={{ color: colors.text, fontWeight: '700' }}>每周从哪一天开始</Text><ChoiceRow options={weekOptions} value={String(settings.weekStart)} onChange={value => setSettings(current => ({ ...current, weekStart: Number(value) }))} /></Card>
    <Field label="每月从几号开始（1～31）" value={monthText} onChangeText={setMonthText} keyboardType="number-pad" maxLength={2} />
    <Text style={{ color: colors.muted, fontSize: 13 }}>例如设为 25 号，则一个月从本月 25 日到下月 24 日；短月遇到 29～31 号时取当月最后一天。</Text>
    <Button title="保存周期设置" onPress={save} />
    <SectionTitle>本机数据</SectionTitle>
    <Card><Text style={{ color: colors.muted, lineHeight: 22 }}>数据只保存在当前设备。换手机前请导出备份文件，在新设备中选择恢复。</Text><Button title="导出完整 JSON 备份" secondary disabled={busy} onPress={backup} /><Button title="从 JSON 文件恢复" secondary disabled={busy} onPress={importBackup} /></Card>
  </Page>;
}
