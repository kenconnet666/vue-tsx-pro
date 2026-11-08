// 表单权限：字段的行跟着表单清单（明细表的列在后面），改一格只动那个节点的 form；没单独写的都去掉时 form 也去掉；
// 旁观的人写进 settings.formView；矩阵的格子是“字段 × 环节”
import { templates, type ProcessDefinition, type TaskNode } from '@zerodep-dev/flow-ts-model';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp, defineComponent, nextTick, type App } from 'vue';
import { AccessMatrix } from '../AccessMatrix';
import {
  accessRows,
  fallbackText,
  patchFormView,
  patchNodeForm,
  withFieldAccess,
  type FormNode,
} from '../form-access';

const definition: ProcessDefinition = {
  ...templates.leave(),
  form: {
    key: 'leave',
    manifest: {
      reason: { label: '事由', type: 'text' },
      lines: {
        label: '明细',
        type: 'list',
        fields: { day: { label: '日期', type: 'date' } },
      },
    },
  },
};
const task = (current: ProcessDefinition) =>
  current.nodes.find((node) => node.id === 'manager') as TaskNode;

describe('表单权限的改法', () => {
  it('字段的行：清单里的字段，明细表的列跟在后面', () => {
    expect(accessRows(definition)).toEqual([
      { path: 'reason', label: '事由', column: false },
      { path: 'lines', label: '明细', column: false },
      { path: 'lines.day', label: '明细 · 日期', column: true },
    ]);
  });

  it('改一格只动那个节点；都改回“没单独写”时 form 去掉', () => {
    const hidden = patchNodeForm('manager', (form) => withFieldAccess(form, 'reason', 'hidden'))(
      definition,
    );
    expect(task(hidden).form).toEqual({ fields: { reason: 'hidden' } });
    const back = patchNodeForm('manager', (form) => withFieldAccess(form, 'reason', 'inherit'))(
      hidden,
    );
    expect(task(back)).not.toHaveProperty('form');
  });

  it('没单独写时的说法：节点的默认，明细表的列跟着明细表', () => {
    const [, lines, day] = accessRows(definition);
    const node = task(
      patchNodeForm('manager', (form) => withFieldAccess(form, 'lines', 'editable'))(definition),
    ) as FormNode;
    expect(fallbackText(node, lines!)).toBe('按默认（只读）');
    expect(fallbackText(node, day!)).toBe('跟着明细表（能改）');
  });

  it('旁观的人写进 settings.formView，去掉最后一个时 settings 也去掉', () => {
    const viewed = patchFormView('reason', 'hidden')(definition);
    expect(viewed.settings).toEqual({ formView: { reason: 'hidden' } });
    expect(patchFormView('reason', 'inherit')(viewed)).not.toHaveProperty('settings');
  });
});

const mounted: { app: App; host: HTMLElement }[] = [];
afterEach(() => {
  for (const { app, host } of mounted.splice(0)) {
    app.unmount();
    host.remove();
  }
});

describe('AccessMatrix', () => {
  it('行是字段、列是开始与人工环节再加旁观的人；格子的读屏名说明是哪个字段在哪一步', async () => {
    const host = document.createElement('div');
    document.body.append(host);
    const app = createApp(
      defineComponent({
        setup: () => () => <AccessMatrix definition={definition} onChange={() => {}} />,
      }),
    );
    app.mount(host);
    mounted.push({ app, host });
    await nextTick();
    const headers = [...host.querySelectorAll('thead th')].map((th) => th.textContent?.trim());
    expect(headers).toEqual(['字段', '提交', '经理审批', '人事备案', '旁观的人']);
    // 一行默认加三行字段
    expect(host.querySelectorAll('tbody tr')).toHaveLength(4);
    const labels = [...host.querySelectorAll('[role="combobox"]')].map((el) =>
      el.getAttribute('aria-label'),
    );
    expect(labels).toContain('“事由”在“经理审批”');
    expect(labels).toContain('“事由”对旁观的人');
    // 明细表的列没有旁观的人那一格
    expect(labels).not.toContain('“明细 · 日期”对旁观的人');
  });
});
