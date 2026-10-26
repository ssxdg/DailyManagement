import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, colors, Empty, Page } from '@/components/ui';
import { deleteExpense, listCategories, listExpenses } from '@/lib/database';
import { formatCents, localDay, type Category, type Expense } from '@/lib/domain';

export default function ExpensesScreen() {
  const router = useRouter();
  const [items, setItems] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState('all');
  const refresh = useCallback(() => Promise.all([listExpenses(), listCategories()]).then(([nextItems, nextCategories]) => { setItems(nextItems); setCategories(nextCategories); }), []);
  useFocusEffect(useCallback(() => { refresh().catch(error => Alert.alert('读取失败', String(error))); }, [refresh]));

  function remove(item: Expense) {
    Alert.alert('删除支出', `确定删除 ¥${formatCents(item.amountCents)} 这笔记录吗？`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => deleteExpense(item.id).then(refresh).catch(error => Alert.alert('删除失败', String(error))) },
    ]);
  }

  const today = localDay();
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = localDay(yesterdayDate);
  // 顶部今日汇总始终展示全部分类，分类标签仅筛选下方记录。
  const todayItems = items.filter(item => item.occurredOn === today);
  const todayCents = todayItems.reduce((sum, item) => sum + item.amountCents, 0);
  const visibleItems = categoryId === 'all' ? items : items.filter(item => item.categoryId === categoryId);

  return <Page>
    <View style={styles.heading}><Text style={styles.title}>消费管理</Text><Pressable accessibilityRole="button" onPress={() => router.push('/expenses/categories')} hitSlop={8}><Text style={styles.link}>管理分类</Text></Pressable></View>
    <View style={styles.summary}>
      <Text style={styles.summaryLabel}>今日支出</Text>
      <Text style={styles.summaryValue}>¥ {formatCents(todayCents)}</Text>
      <Text style={styles.summaryNote}>{todayItems.length} 笔记录 · 每一笔都清楚可查</Text>
    </View>
    <Button title="＋ 记一笔" onPress={() => router.push('/expenses/form')} />
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
      {[{ id: 'all', name: '全部' }, ...categories].map(category => <Pressable accessibilityRole="button" accessibilityState={{ selected: categoryId === category.id }} key={category.id} onPress={() => setCategoryId(category.id)} style={[styles.filter, categoryId === category.id && styles.filterActive]}><Text style={[styles.filterText, categoryId === category.id && styles.filterTextActive]}>{category.name}</Text></Pressable>)}
    </ScrollView>
    <View style={styles.sectionRow}><Text style={styles.sectionTitle}>支出记录</Text><Pressable accessibilityRole="button" onPress={() => router.push('/expenses/stats')} hitSlop={8}><Text style={styles.link}>查看统计 →</Text></Pressable></View>
    {visibleItems.length === 0 ? <Empty text={items.length === 0 ? '还没有支出记录，点“记一笔”开始。' : '该分类还没有支出记录。'} /> : visibleItems.map((item, index) => {
      const category = categories.find(value => value.id === item.categoryId);
      const dateLabel = item.occurredOn === today ? '今天' : item.occurredOn === yesterday ? '昨天' : item.occurredOn;
      return <View key={item.id}>
        {index === 0 || visibleItems[index - 1].occurredOn !== item.occurredOn ? <Text style={styles.dateHeading}>{dateLabel === item.occurredOn ? dateLabel : `${dateLabel} · ${item.occurredOn}`}</Text> : null}
        <View style={styles.record}>
          <Pressable accessibilityRole="button" accessibilityLabel={`编辑${category?.name ?? '未知分类'}支出，¥${formatCents(item.amountCents)}`} onPress={() => router.push({ pathname: '/expenses/form', params: { id: item.id } })} style={styles.recordMain}>
            <View style={styles.badge}><Text style={styles.badgeText}>{(category?.name ?? '其').slice(0, 1)}</Text></View>
            <View style={styles.recordInfo}><Text style={styles.recordName}>{category?.name ?? '未知分类'}</Text><Text style={styles.recordNote} numberOfLines={1}>{item.note || '无备注'}</Text></View>
            <Text style={styles.amount}>− ¥{formatCents(item.amountCents)}</Text>
          </Pressable>
          <View style={styles.recordActions}><Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/expenses/form', params: { id: item.id } })} style={styles.actionButton}><Text style={styles.link}>编辑</Text></Pressable><Pressable accessibilityRole="button" onPress={() => remove(item)} style={styles.actionButton}><Text style={styles.deleteText}>删除</Text></Pressable></View>
        </View>
      </View>;
    })}
  </Page>;
}

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  title: { color: colors.text, fontSize: 28, fontWeight: '800' },
  link: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  summary: { backgroundColor: colors.yellow, borderRadius: 24, padding: 20, gap: 6 },
  summaryLabel: { color: '#79653E', fontSize: 13 },
  summaryValue: { color: colors.text, fontSize: 34, fontWeight: '800' },
  summaryNote: { color: '#79653E', fontSize: 12 },
  filters: { gap: 8, paddingVertical: 2, paddingRight: 20 },
  filter: { minHeight: 48, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  filterActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  filterTextActive: { color: '#FFFFFF' },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
  dateHeading: { color: colors.muted, fontSize: 12, fontWeight: '700', marginTop: 10, marginBottom: 9 },
  record: { backgroundColor: colors.card, borderRadius: 18, borderWidth: 1, borderColor: colors.border, marginBottom: 9, paddingHorizontal: 13, paddingTop: 13 },
  recordMain: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 11 },
  badge: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.primarySoft },
  badgeText: { color: colors.primary, fontSize: 15, fontWeight: '800' },
  recordInfo: { flex: 1, minWidth: 0, gap: 4 },
  recordName: { color: colors.text, fontSize: 14, fontWeight: '800' },
  recordNote: { color: colors.muted, fontSize: 12 },
  amount: { color: colors.text, fontSize: 15, fontWeight: '800' },
  recordActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  actionButton: { minWidth: 52, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  deleteText: { color: colors.red, fontSize: 13, fontWeight: '800' },
});
