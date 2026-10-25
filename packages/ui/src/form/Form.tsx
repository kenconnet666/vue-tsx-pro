/**
 * 表单（form）：把 useForm 的控制器交给里面的 Field。提交时先校验，没通过就把焦点移到错误汇总（有 FormErrorSummary 时）
 * 或第一个出错的控件上；
 * 原生的 reset（type="reset" 的按钮）回到初始值。
 *
 *   <Form controller={form}>
 *     <form.Field name="email" label="邮箱"><TextField _value={_bind(form.values.email)} /></form.Field>
 *     <Button type="submit" loading={form.submitting}>保存</Button>
 *   </Form>
 *
 * 加了 novalidate：校验与错误信息由 useForm 与 Field 负责，不弹浏览器自带的气泡；控件上的 required 仍告诉读屏“必填”。
 *
 * 整张表单的标签布局（labelPlacement、labelWidth、labelAlign）与只读、不可用在这里统一设置，见 field-layout。
 */
import { createContext, _component } from '@vue-tsx-pro/tsx';
import { nextTick, type VNodeChild } from 'vue';
import { focusControl } from '../utils/dom/focus';
import { mergeAttrs, type PartProps } from '../utils/props';
import { provideFieldLayout, type FieldLayout } from './field-layout';
import type { FormControllerBase } from './useForm';

/** 表单控制器（Field 按 name 读取错误、报告失焦） */
export const FormContext = createContext<FormControllerBase>('Form');

/** 提交与重置由组件管理；未声明的属性落到 form 上 */
export interface FormProps extends PartProps<'form', 'novalidate'>, FieldLayout {
  /** useForm() 创建的控制器 */
  controller: FormControllerBase;
  children?: VNodeChild;
}

/** 表单：提交时校验并聚焦第一个出错的控件，重置回到初始值 */
export const Form = _component(
  ({
    controller,
    labelPlacement,
    labelWidth,
    labelAlign,
    disabled = false,
    readonly = false,
    children,
    ...rest
  }: FormProps) => {
    let form = _state.raw<HTMLFormElement | null>(null);
    // 控制器在表单存在期间不换：只取当前值提供下去
    FormContext.provide(_untrack(controller));
    provideFieldLayout(() => ({ labelPlacement, labelWidth, labelAlign, disabled, readonly }));

    async function onSubmit(event: Event) {
      event.preventDefault();
      if (await controller.submit()) return;
      // 等错误渲染出来（aria-invalid 写到控件上）再移焦点
      await nextTick();
      // 有错误汇总时先到它那里（读屏念出有几项、各是什么），从它的链接跳到字段
      const summary = form?.querySelector<HTMLElement>('[data-form-error-summary]');
      if (summary) return summary.focus();
      const invalid = form?.querySelector<HTMLElement>('[aria-invalid="true"]');
      // 出错的可能是一组控件（RadioGroup 的 radiogroup 本身不能聚焦）：聚焦它里面第一个能聚焦的
      if (invalid) focusControl(invalid);
    }

    function onReset(event: Event) {
      event.preventDefault();
      controller.reset();
    }

    return () => (
      <form
        {...mergeAttrs<'form'>({}, rest, {
          ref: _toRef(form),
          novalidate: true,
          onSubmit: (event: Event) => void onSubmit(event),
          onReset,
        })}
        data-submitting={controller.submitting || undefined}
        data-disabled={disabled || undefined}
        data-readonly={readonly || undefined}
      >
        {children}
      </form>
    );
  },
);
