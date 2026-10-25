// ConditionBuilder：读入条件（not 包着 any 是“都不满足”，嵌套组）、加一条并填完才写回、换字段换比较方式时值跟着变形、
// 换满足方式、删除（删光写回 null）、父级换值时整棵重读、maxDepth 限制加组；焦点落到新加的条件上
import { beforeAll, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import type { Condition, ConditionField } from '../condition';
import { ConditionBuilder } from '../ConditionBuilder';

const fields: ConditionField[] = [
  { name: 'supplier', label: '供应商', type: 'text' },
  {
    name: 'category',
    label: '品类',
    type: 'select',
    options: [
      { value: 'steel', label: '钢材' },
      { value: 'aluminum', label: '铝材' },
    ],
  },
  { name: 'amount', label: '金额', type: 'number' },
];

const flush = async () => {
  for (let index = 0; index < 5; index++) await nextTick();
};

// happy-dom 没有 popover API
beforeAll(() => {
  const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
  proto.showPopover ??= () => {};
  proto.hidePopover ??= () => {};
});

/** 打开一个下拉、点它自己列表里的某一项（每个下拉的选项都在文档里，按 aria-controls 找它的列表） */
async function choose(trigger: HTMLElement, label: string) {
  trigger.click();
  await flush();
  const list = document.getElementById(trigger.getAttribute('aria-controls')!)!;
  const option = [...list.querySelectorAll<HTMLElement>('[role="option"]')].find(
    (item) => item.textContent?.trim() === label,
  );
  if (!option) throw new Error(`没有选项：${label}`);
  option.click();
  await flush();
}

function render(initial: Condition | null, props: Record<string, unknown> = {}) {
  let condition = _state<Condition | null>(initial);
  const root = mount(() => (
    <ConditionBuilder fields={fields} _value={condition} aria-label="审批条件" {...props} />
  ));
  const builder = root.querySelector<HTMLElement>('[aria-label="审批条件"]')!;
  const rules = () => [...builder.querySelectorAll<HTMLElement>('[data-condition-rule]')];
  const combos = (rule: HTMLElement) => [
    ...rule.querySelectorAll<HTMLElement>('button[role="combobox"]'),
  ];
  const button = (text: string) =>
    [...builder.querySelectorAll<HTMLElement>('button')].filter(
      (item) => item.textContent === text,
    );
  return {
    builder,
    rules,
    combos,
    button,
    value: () => condition,
    set: (next: Condition | null) => (condition = next),
  };
}

describe('ConditionBuilder', () => {
  it('读入条件：not 包着 any 是“都不满足”，嵌套的组是一组，每条显示字段与比较方式', () => {
    const { builder, rules, combos } = render({
      not: {
        any: [
          { field: 'supplier', op: 'contains', value: '钢' },
          { all: [{ field: 'amount', op: 'gt', value: 5 }] },
        ],
      },
    });
    expect(builder.getAttribute('role')).toBe('group');
    const modes = builder.querySelectorAll('button[aria-label="满足方式"]');
    expect([...modes].map((mode) => mode.textContent)).toEqual(['都不满足', '全部满足']);
    expect(builder.querySelector('[role="group"][aria-label="条件组"]')).not.toBeNull();
    expect(rules().map((rule) => combos(rule).map((combo) => combo.textContent))).toEqual([
      ['供应商', '包含'],
      ['金额', '大于'],
    ]);
    expect(rules()[0]!.getAttribute('aria-label')).toBe('条件 1');
  });

  it('加一条：焦点落到它的字段上；选了字段、填了值才写回；换比较方式时值跟着变形', async () => {
    const { rules, combos, button, value } = render({
      all: [{ field: 'amount', op: 'gt', value: 5 }],
    });
    button('添加条件')[0]!.click();
    await flush();
    const added = rules()[1]!;
    expect(document.activeElement).toBe(combos(added)[0]);
    expect(value()).toEqual({ all: [{ field: 'amount', op: 'gt', value: 5 }] });

    await choose(combos(added)[0]!, '品类');
    expect(combos(rules()[1]!)[1]!.textContent).toBe('是');
    expect(value()).toEqual({ all: [{ field: 'amount', op: 'gt', value: 5 }] });

    await choose(combos(rules()[1]!)[2]!, '钢材');
    expect(value()).toEqual({
      all: [
        { field: 'amount', op: 'gt', value: 5 },
        { field: 'category', op: 'eq', value: 'steel' },
      ],
    });
    // 是 → 是其中之一：一个值变成一组
    await choose(combos(rules()[1]!)[1]!, '是其中之一');
    expect((value() as { all: Condition[] }).all[1]).toEqual({
      field: 'category',
      op: 'in',
      value: ['steel'],
    });
  });

  it('文字字段：输入就写回；换满足方式写回 any；删掉一条、删光写回 null', async () => {
    const { builder, rules, combos, button, value } = render(null);
    expect(builder.textContent).toContain('还没有条件');
    button('添加条件')[0]!.click();
    await flush();
    await choose(combos(rules()[0]!)[0]!, '供应商');
    const input = rules()[0]!.querySelector('input')!;
    input.value = '华东';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await flush();
    expect(value()).toEqual({ all: [{ field: 'supplier', op: 'contains', value: '华东' }] });

    await choose(builder.querySelector<HTMLElement>('button[aria-label="满足方式"]')!, '任一满足');
    expect(value()).toEqual({ any: [{ field: 'supplier', op: 'contains', value: '华东' }] });

    rules()[0]!.querySelector<HTMLElement>('button[aria-label="删除条件"]')!.click();
    await flush();
    expect(value()).toBeNull();
    expect(rules()).toHaveLength(0);
  });

  it('父级换了值就整棵重读；自己写回的不重读（没填完的条也留着）', async () => {
    const { rules, button, set } = render({ all: [{ field: 'amount', op: 'gt', value: 5 }] });
    button('添加条件')[0]!.click();
    await flush();
    expect(rules()).toHaveLength(2);
    set({
      any: [
        { field: 'supplier', op: 'eq', value: '甲' },
        { field: 'supplier', op: 'eq', value: '乙' },
        { field: 'amount', op: 'exists' },
      ],
    });
    await flush();
    expect(rules()).toHaveLength(3);
  });

  it('maxDepth=1 时不能加组；默认根组里能加一层，组里不再有“添加条件组”', async () => {
    const flat = render(null, { maxDepth: 1 });
    expect(flat.button('添加条件组')).toHaveLength(0);
    const nested = render(null);
    nested.button('添加条件组')[0]!.click();
    await flush();
    expect(nested.button('添加条件组')).toHaveLength(1);
    expect(nested.button('添加条件')).toHaveLength(2);
  });
});
