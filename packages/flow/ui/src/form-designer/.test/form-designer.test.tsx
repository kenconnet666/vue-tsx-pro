// 表单设计器：改清单的函数（加、删、改名带着条件里的引用、重排、明细表的列）；组件：加字段后选中它、改名、预览按清单渲染、问题列出来
import type { FormManifest } from '@zerodep-dev/flow-ts-model';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp, defineComponent, nextTick, type App } from 'vue';
import { FormDesigner } from '../FormDesigner';
import { insertField, orderFields, removeField, renameField, updateField } from '../form-fields';

const manifest: FormManifest = {
  kind: { label: '类型', type: 'text' },
  amount: {
    label: '金额',
    type: 'decimal',
    requiredWhen: { field: 'form.kind', op: 'eq', value: 'travel' },
  },
  lines: { label: '明细', type: 'list', fields: { item: { label: '项目', type: 'text' } } },
};

describe('改清单', () => {
  it('加字段起不重复的名字；明细表里加成列', () => {
    const first = insertField(manifest, { label: '文字', type: 'text' });
    expect(first.path).toBe('text1');
    const second = insertField(first.manifest, { label: '文字', type: 'text' });
    expect(second.path).toBe('text2');
    const column = insertField(manifest, { label: '数字', type: 'number' }, 'lines');
    expect(column.path).toBe('lines.number1');
    expect(Object.keys((column.manifest.lines as { fields: FormManifest }).fields)).toEqual([
      'item',
      'number1',
    ]);
  });

  it('改名位置不变，条件里的 form.旧名 跟着改；名字不合法或重名时报错', () => {
    const renamed = renameField(manifest, 'kind', 'category');
    expect(Object.keys(renamed)).toEqual(['category', 'amount', 'lines']);
    expect(renamed.amount!.requiredWhen).toEqual({
      field: 'form.category',
      op: 'eq',
      value: 'travel',
    });
    expect(() => renameField(manifest, 'kind', 'Bad')).toThrow(/小写字母开头/);
    expect(() => renameField(manifest, 'kind', 'amount')).toThrow(/已经有/);
    expect(Object.keys(renameField(manifest, 'lines.item', 'name').lines!.fields!)).toEqual([
      'name',
    ]);
  });

  it('改、删、重排', () => {
    expect(
      updateField(manifest, 'lines.item', (f) => ({ ...f, label: '品名' })).lines!.fields!.item!
        .label,
    ).toBe('品名');
    expect(Object.keys(removeField(manifest, 'amount'))).toEqual(['kind', 'lines']);
    expect(Object.keys(orderFields(manifest, ['lines', 'kind']))).toEqual([
      'lines',
      'kind',
      'amount',
    ]);
  });
});

const mounted: { app: App; host: HTMLElement }[] = [];
afterEach(() => {
  for (const { app, host } of mounted.splice(0)) {
    app.unmount();
    host.remove();
  }
});

const flush = async () => {
  for (let i = 0; i < 6; i++) await nextTick();
};

function setup(initial: FormManifest) {
  let current = _state(initial);
  const host = document.createElement('div');
  document.body.append(host);
  const app = createApp(
    defineComponent({
      setup: () => () => <FormDesigner manifest={current} onChange={(next) => (current = next)} />,
    }),
  );
  app.mount(host);
  mounted.push({ app, host });
  return { host, manifest: () => current };
}

const button = (host: Element, text: string) =>
  [...host.querySelectorAll('button')].find((b) => b.textContent?.trim() === text) as HTMLElement;

describe('FormDesigner', () => {
  it('加字段后选中它；改字段名失焦时提交；预览按清单渲染', async () => {
    const { host, manifest: current } = setup(manifest);
    await flush();
    button(host.querySelector('[aria-label="加字段"]')!, '数字').click();
    await flush();
    expect(Object.keys(current())).toContain('number1');
    const name = [...host.querySelectorAll('label')].find((label) =>
      label.textContent?.includes('字段名'),
    )!.control as HTMLInputElement;
    expect(name.value).toBe('number1');
    name.value = 'days';
    name.dispatchEvent(new Event('input'));
    name.dispatchEvent(new FocusEvent('blur'));
    await flush();
    expect(Object.keys(current())).toEqual(['kind', 'amount', 'lines', 'days']);

    const preview = [...host.querySelectorAll('[role="tab"]')].find(
      (tab) => tab.textContent === '预览',
    ) as HTMLElement;
    preview.click();
    await flush();
    expect(host.querySelector('[role="tabpanel"]:not([hidden]) form')).not.toBeNull();
  });

  it('清单的问题列出来', async () => {
    const { host } = setup({ kind: { label: '', type: 'select', options: [] } });
    await flush();
    expect(host.textContent).toContain('还没有名称');
    expect(host.textContent).toContain('还没有选项');
  });
});
