import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, Page } from '@/components/ui';
import { getDatabase, listExpenses, listWeights } from '@/lib/database';
import { formatCents, localDay } from '@/lib/domain';

export default function HomeScreen() {
  const router = useRouter();
  const [todayCents, setTodayCents] = useState(0);
  const [latestWeight, setLatestWeight] = useState<number | null>(null);
  const now = new Date();
  const dateLabel = `${now.getMonth() + 1} 月 ${now.getDate()} 日 · 星期${'日一二三四五六'[now.getDay()]}`;

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
    <View style={styles.topRow}><Text style={styles.date}>{dateLabel}</Text><Pressable accessibilityRole="button" onPress={() => router.push('/settings')} hitSlop={8}><Text style={styles.textLink}>设置</Text></Pressable></View>
    <View style={styles.hero}>
      <Text style={styles.heroHint}>今天也好好生活</Text>
      <Text style={styles.heroTitle}>日常管理</Text>
      <View style={styles.metrics}>
        <View style={styles.metric}><Text style={styles.metricLabel}>今日支出</Text><Text style={styles.metricValue}>¥ {formatCents(todayCents)}</Text></View>
        <View style={styles.metric}><Text style={styles.metricLabel}>最近体重</Text><Text style={styles.metricValue}>{latestWeight === null ? '尚未记录' : `${latestWeight} kg`}</Text></View>
      </View>
    </View>
    <Text style={styles.sectionTitle}>快速开始</Text>
    <View style={styles.tileGrid}>
      <Pressable accessibilityRole="button" onPress={() => router.push('/expenses/form')} style={({ pressed }) => [styles.tile, styles.greenTile, pressed && styles.pressed]}>
        <Text style={styles.tileMark}>＋</Text><Text style={styles.tileTitle}>记一笔</Text><Text style={styles.tileHint}>消费记录</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => router.push('/health/meal')} style={({ pressed }) => [styles.tile, styles.purpleTile, pressed && styles.pressed]}>
        <Text style={styles.tileMark}>＋</Text><Text style={styles.tileTitle}>记饮食</Text><Text style={styles.tileHint}>健康记录</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => router.push('/expenses')} style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
        <Text style={styles.tileNumber}>01</Text><Text style={styles.tileTitle}>消费管理</Text><Text style={styles.tileHint}>记录与统计 →</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => router.push('/health')} style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
        <Text style={styles.tileNumber}>02</Text><Text style={styles.tileTitle}>健康管理</Text><Text style={styles.tileHint}>饮食与体重 →</Text>
      </Pressable>
    </View>
    <Text style={styles.sectionTitle}>更多</Text>
    <View style={styles.moreRow}>
      <Pressable accessibilityRole="button" onPress={() => router.push('/expenses/stats')} style={({ pressed }) => [styles.moreButton, pressed && styles.pressed]}><Text style={styles.moreText}>统计分析 →</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={() => router.push('/settings')} style={({ pressed }) => [styles.moreButton, pressed && styles.pressed]}><Text style={styles.moreText}>数据备份 →</Text></Pressable>
    </View>
  </Page>;
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 2 },
  date: { color: colors.muted, fontSize: 13 },
  textLink: { color: colors.primary, fontSize: 14, fontWeight: '800', paddingVertical: 8 },
  hero: { backgroundColor: colors.yellow, borderRadius: 26, padding: 18, gap: 8 },
  heroHint: { color: '#826E45', fontSize: 13 },
  heroTitle: { color: colors.text, fontSize: 25, fontWeight: '800', marginBottom: 6 },
  metrics: { flexDirection: 'row', gap: 10 },
  metric: { flex: 1, minWidth: 0, minHeight: 78, backgroundColor: '#FFF9E9', borderRadius: 17, padding: 12, justifyContent: 'center', gap: 6 },
  metricLabel: { color: colors.muted, fontSize: 12 },
  metricValue: { color: colors.text, fontSize: 19, fontWeight: '800' },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '800', marginTop: 8 },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '48%', minHeight: 144, backgroundColor: colors.card, borderRadius: 22, borderWidth: 1, borderColor: colors.border, padding: 16, justifyContent: 'space-between' },
  greenTile: { backgroundColor: colors.primarySoft },
  purpleTile: { backgroundColor: colors.purpleSoft },
  tileMark: { color: colors.text, fontSize: 30, lineHeight: 34 },
  tileNumber: { color: colors.primary, fontSize: 20, fontWeight: '800' },
  tileTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  tileHint: { color: colors.muted, fontSize: 12 },
  moreRow: { flexDirection: 'row', gap: 10 },
  moreButton: { flex: 1, minHeight: 48, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  moreText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  pressed: { opacity: 0.7 },
});
