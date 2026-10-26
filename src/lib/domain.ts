export type PeriodMode = 'week' | 'month';

export type Category = {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
  sortOrder?: number;
};

export type Expense = {
  id: string;
  categoryId: string;
  amountCents: number;
  occurredOn: string;
  note: string;
};

export type MealItem = { name: string; quantity: string; unit: string };
export type Meal = {
  id: string;
  occurredAt: string;
  label: string;
  note: string;
  items: MealItem[];
};
export type Weight = { id: string; occurredAt: string; weightKg: number; note: string };
export type Settings = { weekStart: number; monthStart: number };

function parseDay(day: string): Date {
  return new Date(`${day}T12:00:00Z`);
}

function dayString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function monthAnchor(year: number, monthIndex: number, startDay: number): string {
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  return dayString(new Date(Date.UTC(year, monthIndex, Math.min(startDay, lastDay), 12)));
}

// 月起始号超过当月天数时取月末，确保每个自然月始终有一个周期起点。
export function getPeriodBounds(referenceDay: string, mode: PeriodMode, startDay: number) {
  const day = parseDay(referenceDay);
  if (mode === 'week') {
    if (!Number.isInteger(startDay) || startDay < 1 || startDay > 7) throw new Error('每周起始日无效');
    const offset = (day.getUTCDay() - startDay + 7) % 7;
    day.setUTCDate(day.getUTCDate() - offset);
    const start = dayString(day);
    day.setUTCDate(day.getUTCDate() + 7);
    return { start, endExclusive: dayString(day) };
  }
  if (!Number.isInteger(startDay) || startDay < 1 || startDay > 31) throw new Error('每月起始号无效');
  const year = day.getUTCFullYear();
  const month = day.getUTCMonth();
  const current = monthAnchor(year, month, startDay);
  const isCurrent = referenceDay >= current;
  return {
    start: isCurrent ? current : monthAnchor(year, month - 1, startDay),
    endExclusive: isCurrent ? monthAnchor(year, month + 1, startDay) : current,
  };
}

export function shiftPeriod(referenceDay: string, mode: PeriodMode, direction: -1 | 1, startDay: number): string {
  const { start, endExclusive } = getPeriodBounds(referenceDay, mode, startDay);
  if (direction === 1) return endExclusive;
  if (mode === 'week') {
    const day = parseDay(start);
    day.setUTCDate(day.getUTCDate() - 7);
    return dayString(day);
  }
  const day = parseDay(start);
  return monthAnchor(day.getUTCFullYear(), day.getUTCMonth() - 1, startDay);
}

export function applyAmountKey(current: string, key: string): string {
  if (key === 'backspace') return current.length <= 1 ? '0' : current.slice(0, -1);
  if (key === 'clear') return '0';
  if (key === '.') return current.includes('.') ? current : `${current}.`;
  if (!/^\d$/.test(key)) return current;
  if (current.includes('.') && current.split('.')[1].length >= 2) return current;
  if (current === '0') return key === '0' ? current : key;
  return current.replace(/^0+(?=\d)/, '') + key;
}

export function amountToCents(value: string): number {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) throw new Error('请输入有效金额');
  const [yuan, fen = ''] = value.split('.');
  const cents = Number(yuan) * 100 + Number(fen.padEnd(2, '0'));
  if (!Number.isSafeInteger(cents) || cents <= 0) throw new Error('金额必须大于 0');
  return cents;
}

export function formatCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function summarizeExpenses(expenses: Pick<Expense, 'categoryId' | 'amountCents'>[], categories: Category[]) {
  const totals = new Map<string, number>();
  for (const expense of expenses) totals.set(expense.categoryId, (totals.get(expense.categoryId) ?? 0) + expense.amountCents);
  const totalCents = expenses.reduce((sum, item) => sum + item.amountCents, 0);
  const items = [...totals].map(([id, amountCents]) => {
    const category = categories.find(item => item.id === id);
    return { id, name: category?.name ?? '未知分类', color: category?.color ?? '#94A3B8', amountCents,
      percent: totalCents ? amountCents / totalCents * 100 : 0 };
  }).sort((a, b) => b.amountCents - a.amountCents);
  return { totalCents, items };
}

export function localDay(date = new Date()): string {
  const year = date.getFullYear();
  return `${year}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function localTimestamp(date = new Date()): string {
  const minutes = -date.getTimezoneOffset();
  const sign = minutes >= 0 ? '+' : '-';
  const offset = `${sign}${String(Math.floor(Math.abs(minutes) / 60)).padStart(2, '0')}:${String(Math.abs(minutes) % 60).padStart(2, '0')}`;
  return `${localDay(date)}T${[date.getHours(), date.getMinutes(), date.getSeconds()].map(n => String(n).padStart(2, '0')).join(':')}${offset}`;
}
