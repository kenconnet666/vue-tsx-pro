// 命令式的小表单对话框：字段、必填与校验、提交的值（关闭、离场过渡见浏览器测试）
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { useFormDialog, type FormDialogOptions } from '../form-dialog';

/** 在组件 setup 里拿到 prompt，再打开对话框 */
async function open(options: FormDialogOptions) {
  let prompt!: ReturnType<typeof useFormDialog>;
  const Probe = _component(() => {
    prompt = useFormDialog();
    return () => null;
  });
  mount(() => <Probe />);
  void prompt(options);
  await nextTick();
  await nextTick();
  return document.body.querySelector('dialog')!;
}

const input = (element: HTMLInputElement | HTMLTextAreaElement, value: string) => {
  element.value = value;
  element.dispatchEvent(new Event('input', { bubbles: true }));
};
/** 确认是异步的（对话框等 onConfirm 的结果）：等它走完再看 */
const settle = () => new Promise((resolve) => setTimeout(resolve));
const buttonOf = (dialog: Element, text: string) =>
  [...dialog.querySelectorAll('button')].find((button) => button.textContent === text)!;

afterEach(() => {
  document.body.innerHTML = '';
});

describe('useFormDialog', () => {
  it('渲染到 body：标题、各字段的标签；必填的没填时报错、不提交', async () => {
    const onSubmit = vi.fn();
    const dialog = await open({
      title: '退回收件箱',
      fields: [
        { name: 'reason', label: '原因', type: 'textarea', required: true },
        { name: 'note', label: '备注' },
      ],
      confirmText: '退回',
      onSubmit,
    });
    expect(dialog.textContent).toContain('退回收件箱');
    expect(dialog.querySelector('textarea')).not.toBeNull();
    expect(dialog.querySelectorAll('input')).toHaveLength(1);
    buttonOf(dialog, '退回').click();
    await settle();
    expect(dialog.textContent).toContain('必填');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('填好后提交：值去掉首尾空白；validate 返回说明时报错', async () => {
    const onSubmit = vi.fn();
    const dialog = await open({
      title: '申请改派',
      fields: [
        {
          name: 'reason',
          label: '原因',
          required: true,
          validate: (value) => (value.length < 4 ? '至少写 4 个字' : null),
        },
      ],
      onSubmit,
    });
    const field = dialog.querySelector('input')!;
    input(field, ' 太忙 ');
    buttonOf(dialog, '确定').click();
    await settle();
    expect(dialog.textContent).toContain('至少写 4 个字');
    input(field, '  手上有三件超时的  ');
    buttonOf(dialog, '确定').click();
    await settle();
    expect(onSubmit).toHaveBeenCalledWith({ reason: '手上有三件超时的' });
  });

  it('date 字段：日期选择（分段输入），初始值原样提交', async () => {
    const onSubmit = vi.fn();
    const dialog = await open({
      title: '调整计划',
      fields: [{ name: 'due', label: '计划完成', type: 'date', defaultValue: '2026-12-31' }],
      onSubmit,
    });
    expect(dialog.querySelectorAll('[role="spinbutton"]').length).toBeGreaterThanOrEqual(3);
    buttonOf(dialog, '确定').click();
    await settle();
    expect(onSubmit).toHaveBeenCalledWith({ due: '2026-12-31' });
  });

  it('onSubmit 失败时对话框留着（open 不变）', async () => {
    const dialog = await open({
      title: '指定承办人',
      fields: [{ name: 'who', label: '承办人', defaultValue: '甲' }],
      onSubmit: () => Promise.reject(new Error('网络错误')),
    });
    buttonOf(dialog, '确定').click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await nextTick();
    expect(document.body.contains(dialog)).toBe(true);
    expect((dialog as HTMLDialogElement).open).toBe(true);
  });
});
