import * as SQLite from 'expo-sqlite';

import type { Category, Expense, Meal, Settings, Weight } from './domain';
import type { Backup } from './export';

const defaults: Category[] = [
  ['餐饮', '#0F766E'], ['购物', '#2563EB'], ['交通', '#D97706'], ['住房', '#7C3AED'],
  ['日用', '#DB2777'], ['娱乐', '#0891B2'], ['医疗', '#DC2626'], ['其他', '#64748B'],
].map(([name, color], index) => ({ id: `default-${index}`, name, color, isActive: true, sortOrder: index }));

let databasePromise: Promise<SQLite.SQLiteDatabase> | undefined;

export function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  databasePromise ??= SQLite.openDatabaseAsync('daily-management.db').then(async db => {
    const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    if ((version?.user_version ?? 0) > 1) throw new Error('数据库版本高于当前应用支持版本');
    await db.execAsync(`
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, color TEXT NOT NULL, is_active INTEGER NOT NULL, sort_order INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS expenses (id TEXT PRIMARY KEY, category_id TEXT NOT NULL REFERENCES categories(id), amount_cents INTEGER NOT NULL, occurred_on TEXT NOT NULL, note TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS expenses_date ON expenses(occurred_on);
      CREATE TABLE IF NOT EXISTS meals (id TEXT PRIMARY KEY, occurred_at TEXT NOT NULL, label TEXT NOT NULL, note TEXT NOT NULL, items_json TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS meals_time ON meals(occurred_at);
      CREATE TABLE IF NOT EXISTS weights (id TEXT PRIMARY KEY, occurred_at TEXT NOT NULL, weight_kg REAL NOT NULL, note TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS weights_time ON weights(occurred_at);
      CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value INTEGER NOT NULL);
      PRAGMA user_version = 1;
    `);
    const count = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM categories');
    if (count?.count === 0) {
      await db.withExclusiveTransactionAsync(async tx => {
        for (const item of defaults) await tx.runAsync('INSERT INTO categories VALUES (?, ?, ?, ?, ?)', item.id, item.name, item.color, 1, item.sortOrder ?? 0);
      });
    }
    await db.runAsync('INSERT OR IGNORE INTO settings VALUES (?, ?)', 'weekStart', 1);
    await db.runAsync('INSERT OR IGNORE INTO settings VALUES (?, ?)', 'monthStart', 1);
    return db;
  }).catch(error => { databasePromise = undefined; throw error; });
  return databasePromise;
}

export async function listCategories(): Promise<Category[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ id: string; name: string; color: string; is_active: number; sort_order: number }>('SELECT * FROM categories ORDER BY sort_order, name');
  return rows.map(row => ({ id: row.id, name: row.name, color: row.color, isActive: !!row.is_active, sortOrder: row.sort_order }));
}

export async function saveCategory(category: Category): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('INSERT INTO categories (id, name, color, is_active, sort_order) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, color=excluded.color, is_active=excluded.is_active, sort_order=excluded.sort_order',
    category.id, category.name.trim(), category.color, category.isActive ? 1 : 0, category.sortOrder ?? 100);
}

export async function listExpenses(start?: string, endExclusive?: string): Promise<Expense[]> {
  const db = await getDatabase();
  const rows = start && endExclusive
    ? await db.getAllAsync<{ id: string; category_id: string; amount_cents: number; occurred_on: string; note: string }>('SELECT * FROM expenses WHERE occurred_on >= ? AND occurred_on < ? ORDER BY occurred_on DESC, rowid DESC', start, endExclusive)
    : await db.getAllAsync<{ id: string; category_id: string; amount_cents: number; occurred_on: string; note: string }>('SELECT * FROM expenses ORDER BY occurred_on DESC, rowid DESC');
  return rows.map(row => ({ id: row.id, categoryId: row.category_id, amountCents: row.amount_cents, occurredOn: row.occurred_on, note: row.note }));
}

export async function saveExpense(item: Expense): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('INSERT INTO expenses VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET category_id=excluded.category_id, amount_cents=excluded.amount_cents, occurred_on=excluded.occurred_on, note=excluded.note',
    item.id, item.categoryId, item.amountCents, item.occurredOn, item.note);
}

export async function deleteExpense(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM expenses WHERE id = ?', id);
}

export async function listMeals(): Promise<Meal[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ id: string; occurred_at: string; label: string; note: string; items_json: string }>('SELECT * FROM meals ORDER BY occurred_at DESC');
  return rows.map(row => ({ id: row.id, occurredAt: row.occurred_at, label: row.label, note: row.note, items: JSON.parse(row.items_json) }))
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));
}

export async function saveMeal(item: Meal): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('INSERT INTO meals VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET occurred_at=excluded.occurred_at, label=excluded.label, note=excluded.note, items_json=excluded.items_json',
    item.id, item.occurredAt, item.label, item.note, JSON.stringify(item.items));
}

export async function deleteMeal(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM meals WHERE id = ?', id);
}

export async function listWeights(): Promise<Weight[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ id: string; occurred_at: string; weight_kg: number; note: string }>('SELECT * FROM weights ORDER BY occurred_at DESC');
  return rows.map(row => ({ id: row.id, occurredAt: row.occurred_at, weightKg: row.weight_kg, note: row.note }))
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));
}

export async function saveWeight(item: Weight): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('INSERT INTO weights VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET occurred_at=excluded.occurred_at, weight_kg=excluded.weight_kg, note=excluded.note',
    item.id, item.occurredAt, item.weightKg, item.note);
}

export async function deleteWeight(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM weights WHERE id = ?', id);
}

export async function getSettings(): Promise<Settings> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ key: string; value: number }>('SELECT * FROM settings');
  const values = Object.fromEntries(rows.map(row => [row.key, row.value]));
  return { weekStart: values.weekStart ?? 1, monthStart: values.monthStart ?? 1 };
}

export async function saveSettings(settings: Settings): Promise<void> {
  const db = await getDatabase();
  await db.withExclusiveTransactionAsync(async tx => {
    await tx.runAsync('INSERT OR REPLACE INTO settings VALUES (?, ?)', 'weekStart', settings.weekStart);
    await tx.runAsync('INSERT OR REPLACE INTO settings VALUES (?, ?)', 'monthStart', settings.monthStart);
  });
}

export async function createBackup(): Promise<Backup> {
  const [categories, expenses, meals, weights, settings] = await Promise.all([listCategories(), listExpenses(), listMeals(), listWeights(), getSettings()]);
  return { version: 1, exportedAt: new Date().toISOString(), categories, expenses, meals, weights, settings };
}

// 恢复在单个事务中完成；任一写入失败会回滚，保留原有全部记录。
export async function restoreBackup(backup: Backup): Promise<void> {
  const db = await getDatabase();
  await db.withExclusiveTransactionAsync(async tx => {
    await tx.execAsync('DELETE FROM expenses; DELETE FROM meals; DELETE FROM weights; DELETE FROM categories; DELETE FROM settings;');
    for (const item of backup.categories) await tx.runAsync('INSERT INTO categories VALUES (?, ?, ?, ?, ?)', item.id, item.name, item.color, item.isActive ? 1 : 0, item.sortOrder ?? 100);
    for (const item of backup.expenses) await tx.runAsync('INSERT INTO expenses VALUES (?, ?, ?, ?, ?)', item.id, item.categoryId, item.amountCents, item.occurredOn, item.note);
    for (const item of backup.meals) await tx.runAsync('INSERT INTO meals VALUES (?, ?, ?, ?, ?)', item.id, item.occurredAt, item.label, item.note, JSON.stringify(item.items));
    for (const item of backup.weights) await tx.runAsync('INSERT INTO weights VALUES (?, ?, ?, ?)', item.id, item.occurredAt, item.weightKg, item.note);
    await tx.runAsync('INSERT INTO settings VALUES (?, ?)', 'weekStart', backup.settings.weekStart);
    await tx.runAsync('INSERT INTO settings VALUES (?, ?)', 'monthStart', backup.settings.monthStart);
  });
}
