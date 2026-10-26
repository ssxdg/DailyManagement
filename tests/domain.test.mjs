import assert from 'node:assert/strict';
import test from 'node:test';
import { applyAmountKey, getPeriodBounds, shiftPeriod, summarizeExpenses } from '../src/lib/domain.ts';
import { buildHealthMarkdown, validateBackup } from '../src/lib/export.ts';

test('金额键盘限制两位小数并可退格', () => {
  let value = '0';
  for (const key of ['1', '2', '.', '3', '4', '5']) value = applyAmountKey(value, key);
  assert.equal(value, '12.34');
  assert.equal(applyAmountKey(value, 'backspace'), '12.3');
  assert.equal(applyAmountKey('0', '.'), '0.');
});

test('自定义周起始日跨年仍得到完整七天', () => {
  assert.deepEqual(getPeriodBounds('2026-01-01', 'week', 1), {
    start: '2025-12-29', endExclusive: '2026-01-05',
  });
});

test('每月 31 日起始在短月取该月最后一天', () => {
  assert.deepEqual(getPeriodBounds('2026-02-28', 'month', 31), {
    start: '2026-02-28', endExclusive: '2026-03-31',
  });
  assert.equal(shiftPeriod('2026-02-28', 'month', 1, 31), '2026-03-31');
});

test('金额统计使用整数分并保留已停用分类', () => {
  const summary = summarizeExpenses([
    { amountCents: 105, categoryId: 'food' },
    { amountCents: 205, categoryId: 'food' },
    { amountCents: 90, categoryId: 'old' },
  ], [{ id: 'food', name: '餐饮', color: '#009688', isActive: true },
      { id: 'old', name: '旧分类', color: '#888888', isActive: false }]);
  assert.equal(summary.totalCents, 400);
  assert.deepEqual(summary.items.map(item => [item.name, item.amountCents]), [['餐饮', 310], ['旧分类', 90]]);
});

test('健康导出按实际时间排序且保留同一天多次记录', () => {
  const markdown = buildHealthMarkdown('2026-10-26', '2026-10-26', [
    { id: 'm2', occurredAt: '2026-10-26T19:00:00+08:00', label: '', note: '', items: [{ name: '米饭', quantity: '1', unit: '碗' }] },
    { id: 'm1', occurredAt: '2026-10-26T08:00:00+08:00', label: '早餐', note: '', items: [{ name: '鸡蛋', quantity: '2', unit: '个' }] },
  ], [
    { id: 'w2', occurredAt: '2026-10-26T21:00:00+08:00', weightKg: 65.2, note: '' },
    { id: 'w1', occurredAt: '2026-10-26T07:00:00+08:00', weightKg: 65.5, note: '' },
  ]);
  assert.ok(markdown.indexOf('07:00') < markdown.indexOf('08:00'));
  assert.ok(markdown.indexOf('08:00') < markdown.indexOf('19:00'));
  assert.ok(markdown.indexOf('19:00') < markdown.indexOf('21:00'));
  assert.match(markdown, /65\.5 kg/);
  assert.match(markdown, /65\.2 kg/);
});

test('备份校验拒绝结构错误的数据', () => {
  assert.throws(() => validateBackup({ version: 1, expenses: 'bad' }));
});
