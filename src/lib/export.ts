import type { Category, Expense, Meal, Settings, Weight } from './domain';

export type Backup = {
  version: 1;
  exportedAt: string;
  categories: Category[];
  expenses: Expense[];
  meals: Meal[];
  weights: Weight[];
  settings: Settings;
};

export function buildHealthMarkdown(start: string, end: string, meals: Meal[], weights: Weight[]): string {
  const events = [
    ...meals.filter(item => item.occurredAt.slice(0, 10) >= start && item.occurredAt.slice(0, 10) <= end)
      .map(item => ({ at: item.occurredAt, kind: '饮食', text: `${item.label ? `${item.label}：` : ''}${item.items.map(food => `${food.name} ${food.quantity}${food.unit}`).join('、')}${item.note ? `；备注：${item.note}` : ''}` })),
    ...weights.filter(item => item.occurredAt.slice(0, 10) >= start && item.occurredAt.slice(0, 10) <= end)
      .map(item => ({ at: item.occurredAt, kind: '体重', text: `${item.weightKg} kg${item.note ? `；备注：${item.note}` : ''}` })),
  ].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  const lines = [`# 健康记录`, ``, `范围：${start} 至 ${end}`, `饮食 ${events.filter(item => item.kind === '饮食').length} 次；体重 ${events.filter(item => item.kind === '体重').length} 次。`, ''];
  if (!events.length) lines.push('此时间范围内没有记录。');
  for (const event of events) lines.push(`- ${event.at.slice(0, 10)} ${event.at.slice(11, 16)} [${event.kind}] ${event.text}`);
  return lines.join('\n') + '\n';
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isText(value: unknown): value is string { return typeof value === 'string'; }
function isDate(value: unknown): value is string { return isText(value) && /^\d{4}-\d{2}-\d{2}$/.test(value); }
function isTimestamp(value: unknown): value is string { return isText(value) && !Number.isNaN(Date.parse(value)) && /[+-]\d{2}:\d{2}$/.test(value); }

// 导入前完整校验引用和数值，避免清空原数据库后才发现备份损坏。
export function validateBackup(value: unknown): Backup {
  if (!isObject(value) || value.version !== 1 || !isText(value.exportedAt) ||
      !Array.isArray(value.categories) || !Array.isArray(value.expenses) ||
      !Array.isArray(value.meals) || !Array.isArray(value.weights) || !isObject(value.settings)) throw new Error('备份格式不受支持');
  const categories = value.categories;
  if (!categories.length) throw new Error('备份缺少分类');
  const categoryIds = new Set<string>();
  for (const row of categories) {
    if (!isObject(row) || !isText(row.id) || !row.id || !isText(row.name) || !isText(row.color) || typeof row.isActive !== 'boolean' || categoryIds.has(row.id)) throw new Error('分类数据无效');
    categoryIds.add(row.id);
  }
  for (const row of value.expenses) {
    if (!isObject(row) || !isText(row.id) || !categoryIds.has(String(row.categoryId)) || !Number.isSafeInteger(row.amountCents) || Number(row.amountCents) <= 0 || !isDate(row.occurredOn) || !isText(row.note)) throw new Error('支出数据无效');
  }
  if (new Set(value.expenses.map((row: Record<string, unknown>) => row.id)).size !== value.expenses.length) throw new Error('支出编号重复');
  for (const row of value.meals) {
    if (!isObject(row) || !isText(row.id) || !isTimestamp(row.occurredAt) || !isText(row.label) || !isText(row.note) || !Array.isArray(row.items) || !row.items.length || row.items.some((item: unknown) => !isObject(item) || !isText(item.name) || !isText(item.quantity) || !isText(item.unit))) throw new Error('饮食数据无效');
  }
  if (new Set(value.meals.map((row: Record<string, unknown>) => row.id)).size !== value.meals.length) throw new Error('饮食编号重复');
  for (const row of value.weights) {
    if (!isObject(row) || !isText(row.id) || !isTimestamp(row.occurredAt) || typeof row.weightKg !== 'number' || !Number.isFinite(row.weightKg) || row.weightKg <= 0 || !isText(row.note)) throw new Error('体重数据无效');
  }
  if (new Set(value.weights.map((row: Record<string, unknown>) => row.id)).size !== value.weights.length) throw new Error('体重编号重复');
  if (!Number.isInteger(value.settings.weekStart) || Number(value.settings.weekStart) < 1 || Number(value.settings.weekStart) > 7 ||
      !Number.isInteger(value.settings.monthStart) || Number(value.settings.monthStart) < 1 || Number(value.settings.monthStart) > 31) throw new Error('周期设置无效');
  return value as Backup;
}
