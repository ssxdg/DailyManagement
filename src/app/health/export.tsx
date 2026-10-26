import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Alert, Text } from 'react-native';

import { Button, Card, colors, DateField, Page, Title } from '@/components/ui';
import { listMeals, listWeights } from '@/lib/database';
import { localDay } from '@/lib/domain';
import { buildHealthMarkdown } from '@/lib/export';

const initialStart = new Date();
initialStart.setDate(initialStart.getDate() - 29);

export default function HealthExportScreen() {
  const [start, setStart] = useState(localDay(initialStart));
  const [end, setEnd] = useState(localDay());
  const [busy, setBusy] = useState(false);
  async function exportFile() {
    if (start > end) return Alert.alert('日期范围无效', '开始日期不能晚于结束日期。');
    try {
      setBusy(true);
      if (!await Sharing.isAvailableAsync()) throw new Error('当前设备不支持文件分享');
      const [meals, weights] = await Promise.all([listMeals(), listWeights()]);
      const content = buildHealthMarkdown(start, end, meals, weights);
      const file = new File(Paths.cache, `health-${start}-${end}.md`);
      file.create({ overwrite: true });
      await file.write(content);
      await Sharing.shareAsync(file.uri, { mimeType: 'text/markdown', dialogTitle: '分享健康记录' });
    } catch (error) { Alert.alert('导出失败', String(error)); }
    finally { setBusy(false); }
  }
  return <Page><Title subtitle="按记录时间整理成 Markdown，可分享给大模型分析。">导出健康记录</Title>
    <Card><Text style={{ color: colors.text, lineHeight: 23 }}>导出内容包括范围内的全部饮食和体重记录。文件由你选择分享对象，应用不会自动上传。</Text></Card>
    <DateField label="开始日期" value={start} onChange={setStart} />
    <DateField label="结束日期" value={end} onChange={setEnd} />
    <Button title={busy ? '生成中…' : '生成并分享 Markdown'} onPress={exportFile} disabled={busy} />
  </Page>;
}
