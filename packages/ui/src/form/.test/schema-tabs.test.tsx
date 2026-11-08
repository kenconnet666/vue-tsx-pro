// 页签：meta 的 tab 把字段分到标签页里，没写的排在页签前面；聚焦别的页签里的字段时（错误汇总的链接）那一页切过来
import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { z } from 'zod';
import { mount } from '../../utils/.test/mount';
import { SchemaForm } from '../SchemaForm';
import { useForm } from '../useForm';

const flush = async () => {
  for (let i = 0; i < 8; i++) await nextTick();
};

const schema = z.object({
  title: z.string().meta({ title: '标题' }),
  applicant: z.string().meta({ title: '申请人', tab: '基本' }),
  amount: z.string().min(1, '请填写金额').meta({ title: '金额', tab: '费用' }),
});

function setup() {
  return mount(() =>
    h(
      defineComponent({
        setup() {
          const form = useForm({ schema, initial: { title: 'a', applicant: 'b', amount: '' } });
          return () => <SchemaForm controller={form} />;
        },
      }),
    ),
  );
}

const selectedTab = (root: Element) =>
  root.querySelector('[role="tab"][aria-selected="true"]')?.textContent?.trim();

describe('表单页签', () => {
  it('写了 tab 的字段进标签页，没写的在页签前面；默认是第一个页签', async () => {
    const root = setup();
    await flush();
    const tabs = [...root.querySelectorAll('[role="tab"]')].map((tab) => tab.textContent?.trim());
    expect(tabs).toEqual(['基本', '费用']);
    expect(selectedTab(root)).toBe('基本');
    const list = root.querySelector('[role="tablist"]')!;
    expect(root.textContent!.indexOf('标题')).toBeLessThan(
      root.textContent!.indexOf(list.textContent!),
    );
  });

  it('提交不通过后，点错误汇总里的字段切到它的页签并聚焦它', async () => {
    const root = setup();
    await flush();
    root.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await flush();
    expect(selectedTab(root)).toBe('基本');
    (root.querySelector('[data-form-error-summary] a') as HTMLElement).click();
    await flush();
    expect(selectedTab(root)).toBe('费用');
    const input = root.querySelector('[aria-invalid="true"]');
    expect(input?.closest('[role="tabpanel"]')?.hasAttribute('hidden')).toBe(false);
    expect(document.activeElement).toBe(input);
  });
});
