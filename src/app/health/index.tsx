import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { WeightTrend } from '@/components/charts';
import { Button, Card, ChoiceRow, colors, Empty, Page, SectionTitle, Title } from '@/components/ui';
import { deleteMeal, deleteWeight, listMeals, listWeights } from '@/lib/database';
import type { Meal, Weight } from '@/lib/domain';

export default function HealthScreen() {
  const router = useRouter();
  const [tab, setTab] = useState('meals');
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
    <Title subtitle="记录每一次进食与称重，不限制每天次数。">健康管理</Title>
    <View style={styles.actions}><View style={styles.half}><Button title="＋ 记饮食" onPress={() => router.push('/health/meal')} /></View><View style={styles.half}><Button title="＋ 记体重" onPress={() => router.push('/health/weight')} /></View></View>
    <Button title="导出健康记录" secondary onPress={() => router.push('/health/export')} />
    <ChoiceRow options={[{ label: `饮食 ${meals.length}`, value: 'meals' }, { label: `体重 ${weights.length}`, value: 'weights' }]} value={tab} onChange={setTab} />
    {tab === 'meals' ? <>
      <SectionTitle>饮食记录</SectionTitle>
      {meals.length === 0 ? <Empty text="还没有饮食记录。每次进食都可以单独添加。" /> : meals.map(item => <Card key={item.id}>
        <Text style={styles.time}>{item.occurredAt.slice(0, 16).replace('T', '  ')}{item.label ? ` · ${item.label}` : ''}</Text>
        <Text style={styles.content}>{item.items.map(food => `${food.name} ${food.quantity}${food.unit}`).join('、')}</Text>
        {item.note ? <Text style={styles.note}>{item.note}</Text> : null}
        <View style={styles.links}><Pressable accessibilityRole="button" style={styles.linkButton} onPress={() => router.push({ pathname: '/health/meal', params: { id: item.id } })}><Text style={styles.link}>编辑</Text></Pressable><Pressable accessibilityRole="button" style={styles.linkButton} onPress={() => remove('meal', item.id)}><Text style={[styles.link, styles.delete]}>删除</Text></Pressable></View>
      </Card>)}
    </> : <>
      {weights.length > 1 ? <Card><WeightTrend weights={weights} /></Card> : null}
      <SectionTitle>体重记录</SectionTitle>
      {weights.length === 0 ? <Empty text="还没有体重记录。一天可以记录多次。" /> : weights.map(item => <Card key={item.id}>
        <View style={styles.weightRow}><Text style={styles.time}>{item.occurredAt.slice(0, 16).replace('T', '  ')}</Text><Text style={styles.weight}>{item.weightKg} kg</Text></View>
        {item.note ? <Text style={styles.note}>{item.note}</Text> : null}
        <View style={styles.links}><Pressable accessibilityRole="button" style={styles.linkButton} onPress={() => router.push({ pathname: '/health/weight', params: { id: item.id } })}><Text style={styles.link}>编辑</Text></Pressable><Pressable accessibilityRole="button" style={styles.linkButton} onPress={() => remove('weight', item.id)}><Text style={[styles.link, styles.delete]}>删除</Text></Pressable></View>
      </Card>)}
    </>}
  </Page>;
}

const styles = StyleSheet.create({ actions: { flexDirection: 'row', gap: 8 }, half: { flex: 1 }, time: { color: colors.muted, fontSize: 13 }, content: { color: colors.text, fontSize: 16, fontWeight: '600', lineHeight: 24 }, note: { color: colors.muted, fontSize: 13 }, links: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }, linkButton: { minWidth: 52, minHeight: 44, justifyContent: 'center', alignItems: 'center' }, link: { color: colors.primary, fontSize: 14, fontWeight: '700' }, delete: { color: colors.red }, weightRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, weight: { color: colors.text, fontSize: 20, fontWeight: '700' } });
