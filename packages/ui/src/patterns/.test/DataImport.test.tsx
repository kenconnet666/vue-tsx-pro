// DataImport：CSV 上传 → 按名称与别名自动对应列 → 逐行校验（错误标在格子上、只看有错的行）→ 就地改正后重新校验 → 导入通过的行
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { z } from 'zod';
import { mount } from '../../utils/.test/mount';
import { DataImport } from '../DataImport';

const clientHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight')!;
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { get: () => 400 });
  const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
  proto.showPopover ??= () => {};
  proto.hidePopover ??= () => {};
});
afterAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', clientHeight);
});

const flush = async () => {
  await new Promise((resolve) => setTimeout(resolve));
  for (let i = 0; i < 5; i++) await nextTick();
};

const csv = '料号,名称,数量（件）\r\nP-001,支架,40\r\nP-002,,abc\r\nP-003,盖板,12\r\n';

function setup(onImport = vi.fn()) {
  const root = mount(() => (
    <DataImport
      fields={[
        { key: 'part', label: '零件号', required: true, aliases: ['料号'] },
        { key: 'name', label: '名称', required: true },
        { key: 'quantity', label: '数量', type: 'number' },
      ]}
      schema={z.object({
        part: z.string().min(1),
        name: z.string('请填写名称').min(1, '请填写名称'),
        quantity: z.coerce.number('数量要是数字').int().positive('数量要大于 0'),
      })}
      onImport={onImport}
    />
  ));
  const button = (text: string) =>
    [...root.querySelectorAll('button')].find((item) => item.textContent === text)!;
  return { root, button, onImport };
}

async function upload(root: Element) {
  const input = root.querySelector<HTMLInputElement>('input[type="file"]')!;
  const file = new File([csv], '零件.csv', { type: 'text/csv' });
  Object.defineProperty(input, 'files', { value: [file] });
  input.dispatchEvent(new Event('change', { bubbles: true }));
  await flush();
}

describe('DataImport', () => {
  it('上传后按名称、别名自动对应列（“数量（件）”也认作“数量”），示例是文件里的头两个值', async () => {
    const { root } = setup();
    await upload(root);
    const combos = [...root.querySelectorAll<HTMLButtonElement>('button[role="combobox"]')];
    expect(combos.map((combo) => combo.textContent)).toEqual(['料号', '名称', '数量（件）']);
    expect(root.textContent).toContain('P-001、P-002');
  });

  it('校验：错误标在格子上、只看有错的行；改正后重新校验，导入通过的行（schema 解析后的值）', async () => {
    const { root, button, onImport } = setup();
    await upload(root);
    button('下一步').click();
    await flush();
    expect(root.textContent).toContain('共 3 行，可以导入 2 行，1 行有错');
    const name = root.querySelector<HTMLElement>('tr[data-key="2"] td[data-column="name"]')!;
    expect(name.getAttribute('aria-invalid')).toBe('true');
    expect(name.getAttribute('title')).toBe('请填写名称');

    // 就地改正名称与数量
    name.focus();
    name.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await flush();
    const input = name.querySelector('input')!;
    input.value = '底座';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    await flush();
    expect(root.textContent).toContain('可以导入 2 行，1 行有错');
    const quantity = root.querySelector<HTMLElement>(
      'tr[data-key="2"] td[data-column="quantity"]',
    )!;
    expect(quantity.getAttribute('title')).toBe('数量要是数字');

    button('导入 2 行').click();
    await flush();
    expect(onImport).toHaveBeenCalledWith([
      { part: 'P-001', name: '支架', quantity: 40 },
      { part: 'P-003', name: '盖板', quantity: 12 },
    ]);
    expect(root.textContent).toContain('已导入 2 行');
  });
});
