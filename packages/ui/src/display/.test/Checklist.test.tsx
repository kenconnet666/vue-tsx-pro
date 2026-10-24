// Checklist：各项的状态写给读屏、超时的日期用危险色、不适用的不算进汇总；可以勾选时状态是复选按钮；
// inline 一行排开；icons 只有图标，整组一个说明
import { describe, expect, it, vi } from 'vitest';
import { hasStyles, mount } from '../../utils/.test/mount';
import { Checklist, checklistStyles, type ChecklistItem } from '../Checklist';

const items: ChecklistItem[] = [
  { label: '验证窗结论', status: 'done', date: '10-12', evidence: <a href="/r">验证报告.pdf</a> },
  { label: '收益认定意见', status: 'overdue', owner: '成本团队', date: '计划 10-20' },
  { label: '商务谈定记录', description: '谈定价格与生效日期', owner: '采购部' },
  { label: '海关备案', status: 'skipped' },
];

describe('Checklist', () => {
  it('一项一行：状态写给读屏，负责人 · 日期 · 证据在名称下面，超时的日期是危险色', () => {
    const root = mount(() => <Checklist items={items} />);
    const rows = [...root.querySelectorAll('li')];
    expect(rows.map((row) => row.getAttribute('data-status'))).toEqual([
      'done',
      'overdue',
      'todo',
      'skipped',
    ]);
    expect(rows[0]!.textContent).toBe('已完成验证窗结论10-12验证报告.pdf');
    expect(rows[2]!.textContent).toContain('谈定价格与生效日期');
    const late = [...rows[1]!.querySelectorAll('span')].find(
      (span) => span.textContent === '计划 10-20',
    )!;
    expect(hasStyles(late, checklistStyles.late)).toBe(true);
  });

  it('summary：已完成数 / 总数，不适用的不算', () => {
    const root = mount(() => <Checklist items={items} summary />);
    expect(root.textContent).toContain('已完成 1 / 3');
    expect(root.querySelector('[role="progressbar"]')!.getAttribute('aria-valuenow')).toBe('1');
  });

  it('可以勾选：状态是 role=checkbox 的按钮，名称是这一项；不适用的不能勾', () => {
    const onCheckedChange = vi.fn();
    const root = mount(() => <Checklist items={items} onCheckedChange={onCheckedChange} />);
    const boxes = [...root.querySelectorAll<HTMLButtonElement>('button[role="checkbox"]')];
    expect(boxes.map((box) => box.getAttribute('aria-checked'))).toEqual([
      'true',
      'false',
      'false',
      'false',
    ]);
    const name = document.getElementById(boxes[1]!.getAttribute('aria-labelledby')!)!;
    expect(name.textContent).toBe('收益认定意见');
    expect(boxes[3]!.disabled).toBe(true);
    boxes[1]!.click();
    expect(onCheckedChange).toHaveBeenCalledWith(items[1], true);
    boxes[0]!.click();
    expect(onCheckedChange).toHaveBeenLastCalledWith(items[0], false);
  });

  it('inline 一行排开；icons 只有图标，整组一个说明', () => {
    const inline = mount(() => <Checklist layout="inline" items={items.slice(0, 2)} />);
    expect(inline.querySelector('ul')!.children).toHaveLength(2);
    const icons = mount(() => <Checklist layout="icons" items={items.slice(0, 3)} />);
    expect(icons.querySelector('[role="img"]')!.getAttribute('aria-label')).toBe(
      '验证窗结论已完成，收益认定意见已超时，商务谈定记录未完成',
    );
  });
});
