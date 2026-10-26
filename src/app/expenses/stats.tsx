import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { ExpenseCharts } from '@/components/charts';
import { Button, Card, ChoiceRow, colors, Empty, Page, Title } from '@/components/ui';
import { getSettings, listCategories, listExpenses } from '@/lib/database';
import { getPeriodBounds, localDay, shiftPeriod, summarizeExpenses, type Category, type Expense, type PeriodMode, type Settings } from '@/lib/domain';

export default function StatsScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<PeriodMode>('month');
  const [reference, setReference] = useState(localDay());
  const [settings, setSettings] = useState<Settings>({ weekStart: 1, monthStart: 1 });
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  useFocusEffect(useCallback(() => {
    Promise.all([getSettings(), listExpenses(), listCategories()]).then(([nextSettings, nextExpenses, nextCategories]) => { setSettings(nextSettings); setExpenses(nextExpenses); setCategories(nextCategories); }).catch(error => Alert.alert('读取失败', String(error)));
  }, []));
  const startDay = mode === 'week' ? settings.weekStart : settings.monthStart;
  const bounds = getPeriodBounds(reference, mode, startDay);
  const endDay = new Date(`${bounds.endExclusive}T12:00:00Z`);
  endDay.setUTCDate(endDay.getUTCDate() - 1);
  const summary = useMemo(() => summarizeExpenses(expenses.filter(item => item.occurredOn >= bounds.start && item.occurredOn < bounds.endExclusive), categories), [expenses, categories, bounds.start, bounds.endExclusive]);
  return <Page><Title subtitle="周期按你的设置自动滚动。">支出统计</Title>
    <ChoiceRow options={[{ label: '按周', value: 'week' }, { label: '按月', value: 'month' }]} value={mode} onChange={value => { setMode(value as PeriodMode); setReference(localDay()); }} />
    <Card><View style={styles.period}><Pressable accessibilityRole="button" accessibilityLabel="上一周期" style={styles.arrowButton} onPress={() => setReference(shiftPeriod(reference, mode, -1, startDay))}><Text style={styles.arrow}>‹</Text></Pressable><View style={styles.periodText}><Text style={styles.periodLabel}>{bounds.start} 至 {endDay.toISOString().slice(0, 10)}</Text><Text style={styles.hint}>按本机日期计算</Text></View><Pressable accessibilityRole="button" accessibilityLabel="下一周期" style={styles.arrowButton} onPress={() => setReference(shiftPeriod(reference, mode, 1, startDay))}><Text style={styles.arrow}>›</Text></Pressable></View></Card>
    {summary.totalCents ? <Card><ExpenseCharts items={summary.items} totalCents={summary.totalCents} /></Card> : <Empty text="这个周期还没有支出记录。" />}
    <Button title="修改周期起始设置" secondary onPress={() => router.push('/settings')} />
  </Page>;
}

const styles = StyleSheet.create({ period: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, arrowButton: { width: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }, arrow: { color: colors.primary, fontSize: 32, fontWeight: '500' }, periodText: { alignItems: 'center', gap: 4 }, periodLabel: { color: colors.text, fontSize: 15, fontWeight: '700' }, hint: { color: colors.muted, fontSize: 11 } });
