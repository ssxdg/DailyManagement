import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Card, colors, Field, Page, Title } from '@/components/ui';
import { listCategories, newId, saveCategory } from '@/lib/database';
import type { Category } from '@/lib/domain';

const palette = ['#0F766E', '#2563EB', '#D97706', '#7C3AED', '#DB2777', '#0891B2'];

export default function CategoriesScreen() {
  const [items, setItems] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const refresh = () => listCategories().then(setItems).catch(error => Alert.alert('读取失败', String(error)));
  useEffect(() => { refresh(); }, []);
  function start(item: Category | null) { setEditing(item ?? { id: newId(), name: '', color: palette[items.length % palette.length], isActive: true, sortOrder: items.length }); setName(item?.name ?? ''); }
  async function save() {
    if (!editing || !name.trim()) return Alert.alert('请输入分类名称');
    try { await saveCategory({ ...editing, name: name.trim() }); setEditing(null); await refresh(); }
    catch { Alert.alert('保存失败', '名称可能与现有分类重复，请检查后重试。'); }
  }
  async function toggle(item: Category) {
    try { await saveCategory({ ...item, isActive: !item.isActive }); await refresh(); }
    catch (error) { Alert.alert('操作失败', String(error)); }
  }
  return <Page><Title subtitle="停用的分类仍会保留在历史支出和统计中。">分类管理</Title>
    <Button title="＋ 新增分类" onPress={() => start(null)} />
    {editing ? <Card><Field label="分类名称" value={name} onChangeText={setName} maxLength={12} autoFocus /><View style={styles.actions}><View style={styles.half}><Button title="取消" secondary onPress={() => setEditing(null)} /></View><View style={styles.half}><Button title="保存" onPress={save} /></View></View></Card> : null}
    {items.map(item => <Card key={item.id}><View style={styles.row}><View style={[styles.dot, { backgroundColor: item.color }]} /><View style={styles.nameArea}><Text style={styles.name}>{item.name}</Text><Text style={styles.status}>{item.isActive ? '使用中' : '已停用'}</Text></View><Pressable accessibilityRole="button" style={styles.linkButton} onPress={() => start(item)}><Text style={styles.link}>改名</Text></Pressable><Pressable accessibilityRole="button" style={styles.linkButton} onPress={() => toggle(item)}><Text style={[styles.link, { color: item.isActive ? colors.red : colors.primary }]}>{item.isActive ? '停用' : '启用'}</Text></Pressable></View></Card>)}
  </Page>;
}

const styles = StyleSheet.create({ actions: { flexDirection: 'row', gap: 8 }, half: { flex: 1 }, row: { flexDirection: 'row', alignItems: 'center', gap: 10 }, dot: { width: 14, height: 14, borderRadius: 7 }, nameArea: { flex: 1, gap: 3 }, name: { color: colors.text, fontSize: 16, fontWeight: '700' }, status: { color: colors.muted, fontSize: 12 }, linkButton: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' }, link: { color: colors.primary, fontSize: 14, fontWeight: '700' } });
