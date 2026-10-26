import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { WeightTrend } from '@/components/charts';
import { Card, colors, Empty, Page } from '@/components/ui';
import { deleteMeal, deleteWeight, listMeals, listWeights } from '@/lib/database';
import type { Meal, Weight } from '@/lib/domain';

export default function HealthScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'meals' | 'weights'>('meals');
  const [meals, setMeals] = useState<Meal[]>([]);
  const [weights, setWeights] = useState<Weight[]>([]);
  const refresh = useCallback(() => Promise.all([listMeals(), listWeights()]).then(([nextMeals, nextWeights]) => { setMeals(nextMeals); setWeights(nextWeights); }), []);
  useFocusEffect(useCallback(() => { refresh().catch(error => Alert.alert('读取失败', String(error))); }, [refresh]));

  function remove(kind: 'meal' | 'weight', id: string) {
    Alert.alert('删除记录', '确定删除这条记录吗？', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => (kind === 'meal' ? deleteMeal(id) : deleteWeight(id)).then(refresh).catch(error => Alert.alert('删除失败', String(error))) },
    ]);
  }

  return <Page>
    <View style={styles.heading}><Text style={styles.title}>健康管理</Text><Pressable accessibilityRole="button" onPress={() => router.push('/health/export')} hitSlop={8}><Text style={styles.link}>导出记录</Text></Pressable></View>
    <View style={styles.summaryRow}>
      <View style={[styles.summaryTile, styles.weightTile]}><Text style={styles.summaryLabel}>最近体重</Text><Text style={styles.summaryValue}>{weights[0] ? `${weights[0].weightKg} kg` : '未记录'}</Text><Text style={styles.summaryHint}>{weights[0]?.occurredAt.slice(0, 10) ?? '开始记录体重'}</Text></View>
      <View style={[styles.summaryTile, styles.mealTile]}><Text style={styles.summaryLabel}>饮食记录</Text><Text style={styles.summaryValue}>{meals.length} 次</Text><Text style={styles.summaryHint}>每次进食独立保存</Text></View>
    </View>
    <View style={styles.actions}>
      <Pressable accessibilityRole="button" onPress={() => router.push('/health/meal')} style={({ pressed }) => [styles.action, pressed && styles.pressed]}><Text style={styles.actionText}>＋ 记饮食</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={() => router.push('/health/weight')} style={({ pressed }) => [styles.action, styles.weightAction, pressed && styles.pressed]}><Text style={styles.actionText}>＋ 记体重</Text></Pressable>
    </View>
    <View style={styles.tabs}>
      <Pressable accessibilityRole="button" accessibilityState={{ selected: tab === 'meals' }} onPress={() => setTab('meals')} style={[styles.tab, tab === 'meals' && styles.activeTab]}><Text style={[styles.tabText, tab === 'meals' && styles.activeTabText]}>饮食 {meals.length}</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityState={{ selected: tab === 'weights' }} onPress={() => setTab('weights')} style={[styles.tab, tab === 'weights' && styles.activeTab]}><Text style={[styles.tabText, tab === 'weights' && styles.activeTabText]}>体重 {weights.length}</Text></Pressable>
    </View>
    {tab === 'meals' ? <>
      <Text style={styles.sectionTitle}>饮食记录</Text>
      {meals.length === 0 ? <Empty text="还没有饮食记录。每次进食都可以单独添加。" /> : meals.map((item, index) => <View key={item.id}>
        {index === 0 || meals[index - 1].occurredAt.slice(0, 10) !== item.occurredAt.slice(0, 10) ? <Text style={styles.dateHeading}>{item.occurredAt.slice(0, 10)}</Text> : null}
        <View style={styles.record}>
          <View style={styles.recordTop}><Text style={styles.mealTag}>{item.label || '饮食'}</Text><Text style={styles.time}>{item.occurredAt.slice(11, 16)}</Text></View>
          <Text style={styles.foods}>{item.items.map(food => food.name).join('、')}</Text>
          <Text style={styles.details} numberOfLines={2}>{item.items.map(food => `${food.name} ${food.quantity}${food.unit}`).join(' · ')}{item.note ? ` · ${item.note}` : ''}</Text>
          <View style={styles.recordActions}><Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/health/meal', params: { id: item.id } })} style={styles.recordButton}><Text style={styles.link}>编辑</Text></Pressable><Pressable accessibilityRole="button" onPress={() => remove('meal', item.id)} style={styles.recordButton}><Text style={styles.deleteText}>删除</Text></Pressable></View>
        </View>
      </View>)}
    </> : <>
      {weights.length > 1 ? <Card><WeightTrend weights={weights} /></Card> : null}
      <Text style={styles.sectionTitle}>体重记录</Text>
      {weights.length === 0 ? <Empty text="还没有体重记录。一天可以记录多次。" /> : weights.map((item, index) => <View key={item.id}>
        {index === 0 || weights[index - 1].occurredAt.slice(0, 10) !== item.occurredAt.slice(0, 10) ? <Text style={styles.dateHeading}>{item.occurredAt.slice(0, 10)}</Text> : null}
        <View style={styles.record}>
          <View style={styles.weightRow}><Text style={styles.time}>{item.occurredAt.slice(11, 16)}</Text><Text style={styles.weightValue}>{item.weightKg} kg</Text></View>
          {item.note ? <Text style={styles.details}>{item.note}</Text> : null}
          <View style={styles.recordActions}><Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/health/weight', params: { id: item.id } })} style={styles.recordButton}><Text style={styles.link}>编辑</Text></Pressable><Pressable accessibilityRole="button" onPress={() => remove('weight', item.id)} style={styles.recordButton}><Text style={styles.deleteText}>删除</Text></Pressable></View>
        </View>
      </View>)}
    </>}
  </Page>;
}

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  title: { color: colors.text, fontSize: 28, fontWeight: '800' },
  link: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryTile: { flex: 1, minWidth: 0, minHeight: 111, borderRadius: 21, padding: 16, justifyContent: 'space-between' },
  weightTile: { backgroundColor: colors.primarySoft },
  mealTile: { backgroundColor: colors.purpleSoft },
  summaryLabel: { color: colors.muted, fontSize: 12 },
  summaryValue: { color: colors.text, fontSize: 23, fontWeight: '800' },
  summaryHint: { color: colors.muted, fontSize: 11 },
  actions: { flexDirection: 'row', gap: 10 },
  action: { flex: 1, minHeight: 50, backgroundColor: colors.primary, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  weightAction: { backgroundColor: colors.purple },
  actionText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  tabs: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 15, padding: 4 },
  tab: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 11 },
  activeTab: { backgroundColor: colors.primarySoft },
  tabText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  activeTabText: { color: colors.primary, fontWeight: '800' },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '800', marginTop: 6 },
  dateHeading: { color: colors.muted, fontSize: 12, fontWeight: '700', marginTop: 6, marginBottom: 9 },
  record: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 18, paddingHorizontal: 15, paddingTop: 14, marginBottom: 9, gap: 8 },
  recordTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mealTag: { overflow: 'hidden', backgroundColor: colors.primarySoft, color: colors.primary, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5, fontSize: 11, fontWeight: '800' },
  time: { color: colors.muted, fontSize: 12 },
  foods: { color: colors.text, fontSize: 15, fontWeight: '800', lineHeight: 22 },
  details: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  recordActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  recordButton: { minWidth: 52, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  deleteText: { color: colors.red, fontSize: 13, fontWeight: '800' },
  weightRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  weightValue: { color: colors.text, fontSize: 22, fontWeight: '800' },
  pressed: { opacity: 0.7 },
});
