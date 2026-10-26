import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button, Card, colors, Page, Title } from '@/components/ui';
import { getDatabase, listExpenses, listWeights } from '@/lib/database';
import { formatCents, localDay } from '@/lib/domain';

export default function HomeScreen() {
  const router = useRouter();
  const [todayCents, setTodayCents] = useState(0);
  const [latestWeight, setLatestWeight] = useState<number | null>(null);
  useFocusEffect(useCallback(() => {
    let active = true;
    getDatabase().then(() => Promise.all([listExpenses(), listWeights()])).then(([expenses, weights]) => {
      if (!active) return;
      setTodayCents(expenses.filter(item => item.occurredOn === localDay()).reduce((sum, item) => sum + item.amountCents, 0));
      setLatestWeight(weights[0]?.weightKg ?? null);
    }).catch(error => Alert.alert('读取首页数据失败', String(error)));
    return () => { active = false; };
  }, []));
  return <Page>
    <View style={styles.header}><Text style={styles.eyebrow}>DAILY MANAGEMENT</Text><Title subtitle="把每天的重要记录，留在自己手中。">日常管理</Title></View>
    <Card onPress={() => router.push('/expenses')} accent={colors.primary}>
      <Text style={styles.cardTitle}>消费管理</Text>
      <Text style={styles.description}>快速记账 · 周月分类统计</Text>
      <Text style={styles.metric}>今日支出  ¥ {formatCents(todayCents)}</Text>
      <Text style={styles.link}>进入消费管理  →</Text>
    </Card>
    <Card onPress={() => router.push('/health')} accent={colors.blue}>
      <Text style={styles.cardTitle}>健康管理</Text>
      <Text style={styles.description}>记录每次饮食与称重，按时间回顾</Text>
      <Text style={styles.metric}>最近体重  {latestWeight === null ? '尚未记录' : `${latestWeight} kg`}</Text>
      <Text style={[styles.link, { color: colors.blue }]}>进入健康管理  →</Text>
    </Card>
    <Button title="周期设置与数据备份" secondary onPress={() => router.push('/settings')} />
  </Page>;
}

const styles = StyleSheet.create({
  header: { paddingTop: 34, paddingBottom: 10, gap: 8 },
  eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  cardTitle: { color: colors.text, fontSize: 23, fontWeight: '700' },
  description: { color: colors.muted, fontSize: 14 },
  metric: { color: colors.text, fontSize: 17, fontWeight: '600', marginTop: 18 },
  link: { color: colors.primary, fontSize: 14, fontWeight: '700', marginTop: 6 },
});
