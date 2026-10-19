/**
 * 表单（form）：把 useForm 的控制器交给里面的 Field。提交时先校验，没通过就把焦点移到第一个出错的控件上；
 * 原生的 reset（type="reset" 的按钮）回到初始值。
 *
 *   <Form controller={form}>
 *     <form.Field name="email" label="邮箱"><TextField value={_bind(form.values.email)} /></form.Field>
 *     <Button type="submit" loading={form.submitting}>保存</Button>
 *   </Form>
 *
 * 加了 novalidate：校验与错误信息由 useForm 与 Field 负责，不弹浏览器自带的气泡；控件上的 required 仍告诉读屏“必填”。
 */
import { createContext, _component } from '@vue-tsx-pro/tsx';
import { nextTick, type VNodeChild } from 'vue';
import { elementProps, mergeProps, type PartProps } from '../utils/props';
import type { FormControllerBase } from './useForm';

/** 表单控制器（Field 按 name 读取错误、报告失焦） */
export const FormContext = createContext<FormControllerBase>('Form');

/** 提交与重置由组件管理；未声明的属性落到 form 上 */
export interface FormProps extends PartProps<'form', 'novalidate'> {
  /** useForm() 创建的控制器 */
  controller: FormControllerBase;
  children?: VNodeChild;
}

/** 表单：提交时校验并聚焦第一个出错的控件，重置回到初始值 */
export const Form = _component(({ controller, children, ...rest }: FormProps) => {
  let form = _state.raw<HTMLFormElement | null>(null);
  // 控制器在表单存在期间不换：只取当前值提供下去
  FormContext.provide(_untrack(controller));

  async function onSubmit(event: Event) {
    event.preventDefault();
    if (await controller.submit()) return;
    // 等错误渲染出来（aria-invalid 写到控件上）再移焦点
    await nextTick();
    form?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }

  function onReset(event: Event) {
    event.preventDefault();
    controller.reset();
  }

  return () => (
    <form
      {...elementProps(
        mergeProps<'form'>({}, rest, {
          ref: _toRef(form),
          novalidate: true,
          onSubmit: (event: Event) => void onSubmit(event),
          onReset,
        }),
      )}
      data-submitting={controller.submitting || undefined}
    >
      {children}
    </form>
  );
});
