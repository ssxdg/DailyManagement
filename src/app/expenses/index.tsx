import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Card, colors, Empty, Page, SectionTitle, Title } from '@/components/ui';
import { deleteExpense, listCategories, listExpenses } from '@/lib/database';
import { formatCents, type Category, type Expense } from '@/lib/domain';

export default function ExpensesScreen() {
  const router = useRouter();
  const [items, setItems] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const refresh = useCallback(() => Promise.all([listExpenses(), listCategories()]).then(([nextItems, nextCategories]) => { setItems(nextItems); setCategories(nextCategories); }), []);
  useFocusEffect(useCallback(() => { refresh().catch(error => Alert.alert('读取失败', String(error))); }, [refresh]));
  function remove(item: Expense) {
    Alert.alert('删除支出', `确定删除 ¥${formatCents(item.amountCents)} 这笔记录吗？`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => deleteExpense(item.id).then(refresh).catch(error => Alert.alert('删除失败', String(error))) },
    ]);
  }
  return <Page>
    <Title subtitle="选分类、输金额，几步记下一笔支出。">消费管理</Title>
    <Button title="＋ 记一笔" onPress={() => router.push('/expenses/form')} />
    <View style={styles.actions}><View style={styles.half}><Button title="查看统计" secondary onPress={() => router.push('/expenses/stats')} /></View><View style={styles.half}><Button title="管理分类" secondary onPress={() => router.push('/expenses/categories')} /></View></View>
    <SectionTitle>支出记录</SectionTitle>
    {items.length === 0 ? <Empty text="还没有支出记录，点“记一笔”开始。" /> : items.map(item => <Card key={item.id}>
      <View style={styles.row}><View style={styles.info}><Text style={styles.name}>{categories.find(category => category.id === item.categoryId)?.name ?? '未知分类'}</Text><Text style={styles.date}>{item.occurredOn}{item.note ? ` · ${item.note}` : ''}</Text></View><Text style={styles.amount}>¥{formatCents(item.amountCents)}</Text></View>
      <View style={styles.linkRow}><Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/expenses/form', params: { id: item.id } })} style={styles.linkButton}><Text style={styles.link}>编辑</Text></Pressable><Pressable accessibilityRole="button" onPress={() => remove(item)} style={styles.linkButton}><Text style={[styles.link, { color: colors.red }]}>删除</Text></Pressable></View>
    </Card>)}
  </Page>;
}

const styles = StyleSheet.create({ actions: { flexDirection: 'row', gap: 10 }, half: { flex: 1 }, row: { flexDirection: 'row', alignItems: 'center', gap: 12 }, info: { flex: 1, gap: 5 }, name: { color: colors.text, fontSize: 17, fontWeight: '700' }, date: { color: colors.muted, fontSize: 13 }, amount: { color: colors.text, fontSize: 18, fontWeight: '700' }, linkRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 5 }, linkButton: { minWidth: 52, minHeight: 44, justifyContent: 'center', alignItems: 'center' }, link: { color: colors.primary, fontSize: 14, fontWeight: '700' } });
