/**
 * 表单对话框：Dialog 加 Form 加错误汇总，确认按钮就是提交——校验没通过时留在对话框里（焦点到第一个出错的字段），
 * 提交（useForm 的 onSubmit）进行时确认按钮显示加载中，成功后关闭，失败（reject）时留着。
 * 字段多、有联动、要自己排版的表单用它；一两个文字字段的小表单用命令式的 useFormDialog。
 *
 *   const form = useForm({ schema, initial, onSubmit: async (values) => { await api.save(values); open = false; } });
 *   <FormDialog controller={form} _open={open} title="新建菜单" size="md">
 *     <form.Field name="name" label="名称"><TextField /></form.Field>
 *   </FormDialog>
 *
 * 提交被后端拒绝（带业务错误码的错误，如“名称已存在”）时，说明显示在表单顶上的提示条里，对话框留着。
 *
 * 打开前由调用方 form.reset(初始值)：新建是空白的初始值，修改是当前记录。在字段里按 Enter 也是提交，
 * 所以 onSubmit 成功后要自己关（写 open = false）；只点确认按钮时对话框会在提交成功后自己关。
 *
 * 部件：Dialog 的全部部件（propsConfirm、propsCancel、propsBody 等），加上 Form（propsForm）与 FormErrorSummary（propsSummary）。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import type { VNodeChild } from 'vue';
import { Alert } from '../feedback/Alert';
import { Form, type FormProps } from '../form/Form';
import { FormErrorSummary, type FormErrorSummaryProps } from '../form/FormErrorSummary';
import type { FormControllerBase } from '../form/useForm';
import { Dialog, type DialogProps } from '../overlay/Dialog';
import { mergePartProps } from '../utils/props';

/** 未声明的属性落到 dialog 上（见 Dialog） */
export interface FormDialogProps extends Omit<DialogProps, 'onConfirm' | 'children'> {
  /** useForm() 创建的控制器；确认按钮调它的 submit */
  controller: FormControllerBase;
  /** 表单（form）的部件属性：标签的布局（labelPlacement、labelWidth）等写在这里 */
  propsForm?: Partial<FormProps>;
  /** 错误汇总的部件属性 */
  propsSummary?: Partial<FormErrorSummaryProps>;
  /** 字段 */
  children?: VNodeChild;
}

/** 表单对话框：确认就是提交，没通过校验或提交失败时留着 */
export const FormDialog = _component(
  ({ controller, propsForm, propsSummary, children, ...rest }: FormDialogProps) =>
    () => (
      <Dialog {...rest} onConfirm={() => controller.submit()}>
        <Form {...mergePartProps<FormProps>({ controller }, propsForm)}>
          {controller.formError && <Alert tone="danger" description={controller.formError} />}
          <FormErrorSummary {...propsSummary} />
          {children}
        </Form>
      </Dialog>
    ),
);
