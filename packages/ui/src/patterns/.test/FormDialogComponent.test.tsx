// FormDialog（组件）：确认按钮就是提交；没通过校验时不提交、留着；提交成功后关闭；后端拒绝时说明显示在顶上、留着
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';
import { z } from 'zod';
import { useForm } from '../../form/useForm';
import { TextField } from '../../input/TextField';
import { HttpError } from '../../utils/request/http';
import { mount } from '../../utils/.test/mount';
import { FormDialog } from '../FormDialog';

const settle = () => new Promise((resolve) => setTimeout(resolve, 20));
const input = (element: HTMLInputElement, value: string) => {
  element.value = value;
  element.dispatchEvent(new Event('input', { bubbles: true }));
};
const confirmButton = () =>
  [...document.body.querySelectorAll('dialog button')].find(
    (button) => button.textContent === '保存',
  ) as HTMLButtonElement;

/** 挂一个带 name 字段的表单对话框；onSubmit 由测试给 */
function setup(onSubmit: (values: { name: string }) => Promise<void>) {
  const open = ref(true);
  const Probe = _component(() => {
    const form = useForm({
      schema: z.object({ name: z.string().min(1, '请填名称') }),
      initial: { name: '' },
      onSubmit: async (values) => {
        await onSubmit(values);
        open.value = false;
      },
    });
    return () => (
      <FormDialog
        controller={form}
        _open={open.value}
        title="新建"
        confirmText="保存"
        onUpdate:_open={(next: boolean) => (open.value = next)}
      >
        <form.Field name="name" label="名称">
          <TextField />
        </form.Field>
      </FormDialog>
    );
  });
  mount(() => <Probe />);
  return open;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FormDialog', () => {
  it('没通过校验：不提交，对话框留着，错误汇总出现', async () => {
    const onSubmit = vi.fn(async () => {});
    const open = setup(onSubmit);
    await nextTick();
    confirmButton().click();
    await settle();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(open.value).toBe(true);
    expect(document.body.textContent).toContain('请填名称');
  });

  it('提交成功：拿到字段的值，对话框关闭', async () => {
    const onSubmit = vi.fn(async () => {});
    const open = setup(onSubmit);
    await nextTick();
    input(document.body.querySelector<HTMLInputElement>('dialog input')!, '联调');
    await nextTick();
    confirmButton().click();
    await settle();
    expect(onSubmit).toHaveBeenCalledWith({ name: '联调' });
    expect(open.value).toBe(false);
  });

  it('后端拒绝（带业务错误码）：说明显示在表单顶上，对话框留着', async () => {
    const onSubmit = vi.fn(async () => {
      throw new HttpError('角色名称已存在: 联调', {
        request: { method: 'POST', url: '/roles' },
        code: 'ruoyi.failed',
      });
    });
    const open = setup(onSubmit);
    await nextTick();
    input(document.body.querySelector<HTMLInputElement>('dialog input')!, '联调');
    await nextTick();
    confirmButton().click();
    await settle();
    expect(open.value).toBe(true);
    expect(document.body.textContent).toContain('角色名称已存在: 联调');
  });
});
