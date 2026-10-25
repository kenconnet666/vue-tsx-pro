/**
 * 确认对话框（role="alertdialog"）：打断当前操作、要用户明确选择“确认”或“取消”，如删除前的确认。
 * 建在 Dialog 的内核上；没有右上角的关闭按钮，点击遮罩不关闭（Esc 仍然等于取消）。
 * 打开时焦点落在“取消”上，误按 Enter 不会执行破坏性操作（同 Radix AlertDialog）。
 *
 *   <AlertDialog
 *     open={_bind(confirming)}
 *     tone="danger"
 *     title="删除这个项目？"
 *     description="删除后无法恢复。"
 *     confirmText="删除"
 *     onConfirm={() => api.remove(id)}
 *   />
 *
 * onConfirm 返回 Promise 时：确认按钮显示加载中、取消与 Esc 暂不可用，完成后关闭；失败时保持打开，由调用方提示错误。
 *
 * 只想在一个操作前问一句时，用命令式的 useConfirm，不必自己管 open：
 *
 *   const confirm = useConfirm();                  // setup 里
 *   if (await confirm({ title: '删除这个项目？', tone: 'danger', confirmText: '删除' })) remove();
 *
 * 要填理由的（驳回、作废、退回）给 reason：对话框里多一个多行输入框，得到填的理由，取消时是 null：
 *
 *   const reason = await confirm({ title: '驳回这个申请？', tone: 'danger', reason: { label: '驳回理由', required: true } });
 *   if (reason !== null) await api.reject(id, reason);
 */
import { _component } from '@vue-tsx-pro/tsx';
import { shallowRef, type VNodeChild } from 'vue';
import { useLang } from '../config/context';
import { useDefaults } from '../config/defaults';
import { useRecipe } from '../config/styles';
import { transitions } from '../utils/style/transitions';
import { Field } from '../form/Field';
import { Textarea } from '../input/Textarea';
import { mergePartProps } from '../utils/props';
import { useDetachedDialog } from './detached';
import { dialogRecipe, type DialogProps } from './Dialog';
import { ModalCore, type ModalCoreProps } from './ModalCore';

/** 未声明的属性落到 dialog 上；确认、取消按钮的属性（onConfirm、confirmText、tone、propsConfirm…）同 Dialog */
export interface AlertDialogProps extends Omit<
  DialogProps,
  'footer' | 'closable' | 'dismissible'
> {}

/** 确认对话框：确认 / 取消两个按钮，焦点先落在取消上 */
export const AlertDialog = _component(
  ({ open = _bindable(false), size, onConfirm, propsCancel, ...rest }: AlertDialogProps) => {
    const appearance = useDefaults('Dialog', () => ({ size }), { size: 'xs' });
    const recipe = useRecipe(dialogRecipe);
    return () => (
      <ModalCore
        {...mergePartProps<ModalCoreProps>(
          {
            title: rest.title,
            parts: recipe({ size: appearance().size }),
            panelSx: transitions.scale,
          },
          rest,
          {
            role: 'alertdialog',
            closable: false,
            dismissible: false,
            // 没写 onConfirm 也有确认按钮：点了就关
            onConfirm: onConfirm ?? (() => {}),
            propsCancel: { autofocus: true, ...propsCancel },
          },
        )}
        open={_bind(open)}
      />
    );
  },
);

/** 确认时要填的理由 */
export interface ConfirmReason {
  /** 输入框的标签（“驳回理由”） */
  label: VNodeChild;
  /** 必填：空着点确认时提示“必填”、不关闭 */
  required?: boolean;
  /** 输入框的占位文字 */
  placeholder?: string;
  /** 输入框下的说明（“申请人会收到这段理由”） */
  description?: VNodeChild;
  /** 最多几个字，显示字数 */
  maxlength?: number;
}

/** confirm() 的选项：AlertDialog 的属性（open 由 confirm 管理） */
export interface ConfirmOptions extends Omit<AlertDialogProps, 'open' | 'onConfirm'> {
  /** 确认：拿到填的理由（没给 reason 时是空字符串）；返回 false 或失败时保持打开 */
  onConfirm?: (reason: string) => unknown;
  /** 要填理由：对话框里多一个多行输入框，confirm 得到填的理由 */
  reason?: ConfirmReason;
}

/** useConfirm 返回的函数：给了 reason 时得到理由（取消时 null），否则得到是否确认 */
export interface Confirm {
  /** 要填理由：确认时得到理由，取消、Esc 时得到 null */
  (options: ConfirmOptions & { reason: ConfirmReason }): Promise<string | null>;
  /** 确认得到 true，取消、Esc 得到 false */
  (options: ConfirmOptions): Promise<boolean>;
}

/**
 * 命令式确认：在组件 setup 里调用，返回 confirm(options)。对话框渲染到 body 末尾，
 * 沿用调用处的主题、语言等配置（ConfigScope）；关闭后自动卸载。
 * 确认（onConfirm 完成）时得到 true（有 reason 时得到理由），取消、Esc 时得到 false（有 reason 时 null）；
 * onConfirm 返回 false 或失败时对话框保持打开，可以再试或取消。
 */
export function useConfirm(): Confirm {
  const mount = useDetachedDialog();
  const lang = useLang();
  const confirm = ({ reason, onConfirm, ...options }: ConfirmOptions) =>
    new Promise<string | boolean | null>((resolve) => {
      let confirmed = false;
      const text = shallowRef('');
      // 必填没填：点确认后才提示，之后随输入更新
      const tried = shallowRef(false);
      const missing = () => !!reason?.required && !text.value.trim();
      mount((host) => (
        <AlertDialog
          {...options}
          // 要填理由时焦点先进输入框；没有理由时落在取消上（误按 Enter 不会执行）
          propsCancel={reason ? { autofocus: false, ...options.propsCancel } : options.propsCancel}
          open={_bind(host.open)}
          onConfirm={async () => {
            tried.value = true;
            if (missing()) return false;
            if ((await onConfirm?.(text.value.trim())) === false) return false;
            confirmed = true;
          }}
          onClose={(event: Event & { currentTarget: HTMLDialogElement }) => {
            options.onClose?.(event);
            resolve(reason ? (confirmed ? text.value.trim() : null) : confirmed);
            host.closed();
          }}
        >
          {options.children}
          {reason && (
            <Field
              label={reason.label}
              description={reason.description}
              required={reason.required}
              error={tried.value && missing() ? lang.formRequired : undefined}
            >
              <Textarea
                value={text.value}
                {...{ 'onUpdate:value': (next: string) => (text.value = next) }}
                placeholder={reason.placeholder}
                maxlength={reason.maxlength}
                showCount={reason.maxlength !== undefined}
                autofocus
              />
            </Field>
          )}
        </AlertDialog>
      ));
    });
  return confirm as Confirm;
}
