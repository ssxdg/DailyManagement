import { useWindowDimensions, View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Polyline, Rect } from 'react-native-svg';

import { colors } from './ui';
import { formatCents, type Weight } from '@/lib/domain';

type ChartItem = { id: string; name: string; color: string; amountCents: number; percent: number };

export function ExpenseCharts({ items, totalCents }: { items: ChartItem[]; totalCents: number }) {
  const { width } = useWindowDimensions();
  // 页面在平板上限制最大宽度，图表也按同一宽度计算，避免横向溢出。
  const barWidth = Math.max(180, Math.min(width, 620) - 120);
  // 饼图最多呈现前五类，其余归入“其他”；完整分类仍在下方柱状图列出。
  const slices = items.length > 6 ? [...items.slice(0, 5), { id: 'combined', name: '其他分类', color: '#94A3B8', amountCents: items.slice(5).reduce((sum, item) => sum + item.amountCents, 0), percent: items.slice(5).reduce((sum, item) => sum + item.percent, 0) }] : items;
  const circumference = 2 * Math.PI * 58;
  return <View style={styles.stack}>
    <View style={styles.pieWrap}>
      <Svg width={160} height={160} viewBox="0 0 160 160">
        {slices.map((item, index) => {
          const dash = circumference * item.percent / 100;
          const offset = -circumference * slices.slice(0, index).reduce((sum, previous) => sum + previous.percent, 0) / 100;
          return <Circle key={item.id} cx={80} cy={80} r={58} fill="none" stroke={item.color} strokeWidth={28} strokeDasharray={`${dash} ${circumference - dash}`} strokeDashoffset={offset} rotation={-90} origin="80,80" />;
        })}
      </Svg>
      <View style={styles.pieCenter}><Text style={styles.pieLabel}>支出合计</Text><Text style={styles.pieTotal}>¥{formatCents(totalCents)}</Text></View>
    </View>
    <Text style={styles.chartTitle}>分类占比</Text>
    {slices.map(item => <View key={item.id} style={styles.legendRow}><View style={[styles.dot, { backgroundColor: item.color }]} /><Text style={styles.legendName}>{item.name}</Text><Text style={styles.legendValue}>{item.percent.toFixed(1)}%</Text></View>)}
    <Text style={styles.chartTitle}>分类金额</Text>
    {items.map(item => <View key={item.id} style={styles.barBlock}>
      <View style={styles.barHeader}><Text style={styles.barName}>{item.name}</Text><Text style={styles.barAmount}>¥{formatCents(item.amountCents)}</Text></View>
      <Svg width={barWidth} height={14}><Rect x={0} y={0} width={barWidth} height={14} rx={7} fill="#E8EFEC" /><Rect x={0} y={0} width={Math.max(5, barWidth * item.amountCents / items[0].amountCents)} height={14} rx={7} fill={item.color} /></Svg>
    </View>)}
  </View>;
}

export function WeightTrend({ weights }: { weights: Weight[] }) {
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(220, Math.min(width, 620) - 88);
  const values = weights.slice(0, 20).reverse();
  if (values.length < 2) return null;
  const min = Math.min(...values.map(item => item.weightKg));
  const max = Math.max(...values.map(item => item.weightKg));
  const span = Math.max(1, max - min);
  const points = values.map((item, index) => `${8 + index * (chartWidth - 16) / (values.length - 1)},${110 - (item.weightKg - min) / span * 90}`).join(' ');
  return <View style={styles.stack}><Text style={styles.chartTitle}>最近 {values.length} 次体重</Text><Svg width={chartWidth} height={130}><Line x1={8} y1={112} x2={chartWidth - 8} y2={112} stroke="#DCE8E4" /><Polyline points={points} fill="none" stroke={colors.blue} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" /></Svg><View style={styles.barHeader}><Text style={styles.pieLabel}>{values[0].occurredAt.slice(0, 10)} · {values[0].weightKg} kg</Text><Text style={styles.pieLabel}>{values.at(-1)?.occurredAt.slice(0, 10)} · {values.at(-1)?.weightKg} kg</Text></View></View>;
}

const styles = StyleSheet.create({
  stack: { gap: 12 }, pieWrap: { alignSelf: 'center', width: 160, height: 160, justifyContent: 'center', alignItems: 'center' },
  pieCenter: { position: 'absolute', alignItems: 'center', gap: 3 }, pieLabel: { color: colors.muted, fontSize: 12 }, pieTotal: { color: colors.text, fontSize: 17, fontWeight: '700' },
  chartTitle: { color: colors.text, fontSize: 17, fontWeight: '700', marginTop: 14 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, dot: { width: 12, height: 12, borderRadius: 6 }, legendName: { flex: 1, color: colors.text, fontSize: 14 }, legendValue: { color: colors.text, fontSize: 14, fontWeight: '700' },
  barBlock: { gap: 7 }, barHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, barName: { color: colors.text, fontSize: 14 }, barAmount: { color: colors.text, fontSize: 14, fontWeight: '700' },
});
