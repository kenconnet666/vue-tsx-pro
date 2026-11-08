// 按字段清单渲染单据：清单 → schema 与控件；线上与表单里的值互换；字段权限按模型包合算（节点权限、条件）；提交时换回线上的形状
import { CalendarDate, parseZonedDateTime } from '@internationalized/date';
import type { FormManifest } from '@zerodep-dev/flow-ts-model';
import { Provider, SchemaForm, schemaFields } from '@zerodep-dev/vue-tsx-pro-ui';
import Decimal from 'decimal.js';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp, defineComponent, nextTick, type App } from 'vue';
import { fromFormValues, toFormValues } from '../form-values';
import { manifestSchema } from '../manifest-schema';
import { manifestAccess, useFlowForm } from '../useFlowForm';

const manifest = {
  title: { label: '事由', type: 'text', required: true, maxLength: 50 },
  kind: {
    label: '类型',
    type: 'select',
    options: [
      { value: 1, label: '差旅' },
      { value: 2, label: '招待' },
    ],
  },
  guests: {
    label: '招待人数',
    type: 'number',
    integer: true,
    visibleWhen: { field: 'form.kind', op: 'eq', value: 2 },
  },
  amount: { label: '金额', type: 'decimal', scale: 2 },
  note: {
    label: '说明',
    type: 'text',
    requiredWhen: { field: 'form.amount', op: 'gt', value: '5000' },
  },
  start: { label: '出发', type: 'date' },
  at: { label: '集合时间', type: 'datetime' },
  owner: { label: '经办人', type: 'people' },
  files: { label: '附件', type: 'file' },
  lines: {
    label: '明细',
    type: 'list',
    fields: { item: { label: '项目', type: 'text' }, cost: { label: '金额', type: 'decimal' } },
  },
} as const satisfies FormManifest;

const TZ = 'Asia/Shanghai';

describe('manifestSchema', () => {
  it('清单的类型选控件：选项（数字写成文字）、Decimal 的值类型、人员、附件、明细表', () => {
    const fields = schemaFields(manifestSchema(manifest));
    const byKey = Object.fromEntries(fields.map((field) => [field.key, field]));
    expect(fields.map((field) => [field.key, field.control])).toEqual([
      ['title', 'text'],
      ['kind', 'select'],
      ['guests', 'number'],
      ['amount', 'number'],
      ['note', 'text'],
      ['start', 'date'],
      ['at', 'datetime'],
      ['owner', 'people'],
      ['files', 'file'],
      ['lines', 'table'],
    ]);
    expect(byKey.kind!.options).toEqual([
      { value: '1', label: '差旅' },
      { value: '2', label: '招待' },
    ]);
    expect(byKey.amount!.valueType).toBe(Decimal);
    expect(byKey.lines!.fields!.map((field) => field.label)).toEqual(['项目', '金额']);
  });

  it('长度、格式只查有值的：必填由权限另算', () => {
    const schema = manifestSchema({
      code: { label: '编号', type: 'text', minLength: 3, pattern: '[A-Z]+' },
    });
    expect(schema.safeParse({ code: '' }).success).toBe(true);
    expect(schema.safeParse({ code: 'AB' }).success).toBe(false);
    expect(schema.safeParse({ code: 'abc' }).success).toBe(false);
    expect(schema.safeParse({ code: 'ABC' }).success).toBe(true);
  });
});

describe('线上与表单里的值', () => {
  it('日期、日期时间、数字选项、附件来回换，别的原样', () => {
    const wire = {
      kind: 2,
      amount: new Decimal('12.50'),
      start: new CalendarDate(2026, 11, 8),
      at: parseZonedDateTime('2026-11-08T09:30:00[Asia/Shanghai]'),
      files: [{ id: 'f1', name: '发票.pdf', size: 10, url: '/f/1' }],
      lines: [{ item: '高铁', cost: new Decimal('553') }],
      extra: 'kept',
    };
    const form = toFormValues(manifest, wire, TZ);
    expect(form).toMatchObject({
      kind: '2',
      start: '2026-11-08',
      at: '2026-11-08T09:30:00',
      files: [{ id: 'f1', name: '发票.pdf', status: 'done', url: '/f/1' }],
      extra: 'kept',
    });
    const back = fromFormValues(manifest, form, TZ);
    expect(back.kind).toBe(2);
    expect((back.amount as Decimal).equals('12.5')).toBe(true);
    expect(String(back.start)).toBe('2026-11-08');
    expect((back.at as { compare(other: unknown): number }).compare(wire.at)).toBe(0);
    expect(back.files).toEqual([{ id: 'f1', name: '发票.pdf', size: 10, url: '/f/1' }]);
  });
});

describe('引擎存的值（普通 JSON）', () => {
  it('人员、附件没填（null）时是空数组：选人、上传组件只认数组', () => {
    const form = toFormValues(manifest, { owner: null, files: null, title: null }, TZ);
    expect(form.owner).toEqual([]);
    expect(form.files).toEqual([]);
    expect(form.title).toBeNull();
  });

  it('小数的文字读成 Decimal，带时区的时刻文字换算成本地时间；交回时按时区还原', () => {
    const form = toFormValues(manifest, { amount: '12.50', at: '2026-11-08T01:30:00Z' }, TZ);
    expect(form.amount).toBeInstanceOf(Decimal);
    expect(form.at).toBe('2026-11-08T09:30:00');
    const back = fromFormValues(manifest, form, TZ);
    expect(String(back.at)).toBe('2026-11-08T09:30:00+08:00[Asia/Shanghai]');
    // 已经是带时区的文字（没经过表单）也认得：同一个时刻
    const direct = fromFormValues(manifest, { at: '2026-11-08T01:30:00Z' }, TZ).at as {
      toDate(): Date;
    };
    expect(direct.toDate().toISOString()).toBe('2026-11-08T01:30:00.000Z');
  });
});

describe('manifestAccess', () => {
  it('节点权限与条件（按线上形状的值算）合成组件库的权限', () => {
    const access = (values: Record<string, unknown>) =>
      manifestAccess(manifest, {
        access: { default: 'editable', fields: { files: 'hidden', title: 'readonly' } },
        values,
        timeZone: TZ,
      });
    const small = access({ kind: '1', amount: new Decimal('100') });
    expect(small).toMatchObject({
      title: 'readonly',
      guests: 'hidden',
      note: 'editable',
      files: 'hidden',
      'lines.cost': 'editable',
    });
    expect(access({ kind: '2', amount: new Decimal('8000') })).toMatchObject({
      guests: 'editable',
      note: 'required',
    });
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
  for (let i = 0; i < 8; i++) await nextTick();
};

describe('useFlowForm', () => {
  it('必填按节点算；提交的值换回线上的形状，看不到的字段不带', async () => {
    let submitted: Record<string, unknown> | undefined;
    const host = document.createElement('div');
    document.body.append(host);
    const app = createApp(
      defineComponent({
        setup() {
          const form = useFlowForm({
            manifest,
            isStart: true,
            access: { fields: { files: 'hidden' } },
            values: { title: '出差', kind: 1, amount: new Decimal('6000') },
            timeZone: TZ,
            onSubmit: (values) => {
              submitted = values;
            },
          });
          // 人员字段要有登记的来源
          return () => (
            <Provider formSources={{ people: { children: async () => [] } }}>
              <SchemaForm controller={form} />
            </Provider>
          );
        },
      }),
    );
    app.mount(host);
    mounted.push({ app, host });
    await flush();
    const submit = () => host.querySelector('form')!.dispatchEvent(new Event('submit'));
    // 金额超过 5000 时说明必填
    submit();
    await flush();
    expect(submitted).toBeUndefined();
    expect(host.textContent).toContain('说明');
    const note = [...host.querySelectorAll('label')].find((label) =>
      label.textContent?.includes('说明'),
    )!.control as HTMLInputElement;
    note.value = '客户回访';
    note.dispatchEvent(new Event('input'));
    submit();
    await flush();
    expect(submitted).toMatchObject({ title: '出差', kind: 1, note: '客户回访' });
    expect(submitted!.amount).toBeInstanceOf(Decimal);
    expect(submitted).not.toHaveProperty('files');
  });
});
