// useConfirm 的理由：对话框里多一个输入框，必填没填时提示、不关闭；确认得到理由，取消得到 null
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { useConfirm, type Confirm } from '../AlertDialog';

const flush = async () => {
  for (let i = 0; i < 6; i++) await nextTick();
};

function setup() {
  let confirm!: Confirm;
  mount(() =>
    h(
      defineComponent({
        setup() {
          confirm = useConfirm();
          return () => null;
        },
      }),
    ),
  );
  const dialog = () => document.querySelector<HTMLDialogElement>('dialog[role="alertdialog"]')!;
  const button = (text: string) =>
    [...dialog().querySelectorAll('button')].find((item) => item.textContent === text)!;
  return { confirm: () => confirm, dialog, button };
}

describe('useConfirm 的理由', () => {
  it('必填没填：点确认提示必填、不关闭；填了确认得到理由，onConfirm 也拿到它', async () => {
    const { confirm, dialog, button } = setup();
    const onConfirm = vi.fn();
    const result = confirm()({
      title: '驳回这个申请？',
      tone: 'danger',
      confirmText: '驳回',
      reason: { label: '驳回理由', required: true },
      onConfirm,
    });
    await flush();
    const textarea = dialog().querySelector('textarea')!;
    expect(textarea.hasAttribute('autofocus')).toBe(true);
    button('驳回').click();
    await flush();
    expect(dialog().textContent).toContain('必填');
    expect(onConfirm).not.toHaveBeenCalled();
    textarea.value = '  附件缺少报价单  ';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    await flush();
    button('驳回').click();
    await flush();
    expect(await result).toBe('附件缺少报价单');
    expect(onConfirm).toHaveBeenCalledWith('附件缺少报价单');
  });

  it('取消得到 null；没给 reason 时照旧得到 false', async () => {
    const { confirm, dialog, button } = setup();
    const withReason = confirm()({ title: '作废？', reason: { label: '作废原因' } });
    await flush();
    button('取消').click();
    await flush();
    expect(await withReason).toBeNull();

    const plain = confirm()({ title: '清空购物车？' });
    await flush();
    expect(dialog().querySelector('textarea')).toBeNull();
    button('取消').click();
    await flush();
    expect(await plain).toBe(false);
  });
});
