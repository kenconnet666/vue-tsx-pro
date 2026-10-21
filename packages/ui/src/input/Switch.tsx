/**
 * 开关（原生 input type="checkbox" + role="switch"）：立即生效的开 / 关设置，如“接收通知”。
 * 需要提交才生效的选项用 Checkbox。结构与样式见 choice-styles.ts：input 画成轨道，滑块叠在上面。
 *
 *   <Switch checked={_bind(notify)}>接收通知</Switch>
 *
 * 读屏念“开关，开 / 关”；空格切换（原生）。在 Field 里时关联说明与错误、沿用其状态。
 * 切换要等接口时用 loading：滑块里转圈、点击无效。轨道里可以放文字或图标（checkedContent / uncheckedContent），对读屏隐藏。
 * 部件：Root（label）、Control（叠放层）、Thumb（滑块）、Content（轨道里的文字）、ContentText（文字的字号层）、Spinner、Label（文字）；未声明的属性落到 input 上。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { useFieldControl } from '../form/Field';
import { Spinner, type SpinnerProps } from '../base/Spinner';
import { useDelayedLoading } from '../utils/motion/delayed-loading';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { focusRingStyles } from '../utils/style/styles';
import type { StatusTone } from '../utils/style/tone-styles';
import type { TextSize } from '../utils/style/typography';
import { choiceRootSx, choiceStyles, syncChecked, useChoiceAppearance } from './choice-styles';

/** 角色、勾选状态与可用性由组件管理；原生的 size 属性让给字号档位 */
export type SwitchManaged =
  | 'type'
  | 'role'
  | 'checked'
  | 'disabled'
  | 'required'
  | 'size'
  | 'aria-invalid'
  | 'aria-describedby'
  | 'aria-busy';

/** 未声明的属性落到 input 上；外层 label 用 propsRoot */
export interface SwitchProps extends PartProps<'input', SwitchManaged> {
  /** 是否打开：父级写 checked={_bind(x)} */
  checked?: boolean;
  /** 不可用 */
  disabled?: boolean;
  /** 只读：能聚焦、读屏念“只读”，不能切换（查看详情、审批时）；外观照常 */
  readonly?: boolean;
  /** 必填 */
  required?: boolean;
  /** 校验未通过 */
  invalid?: boolean;
  /** 切换中（如等接口返回）：滑块里显示加载指示，点击无效，带 aria-busy */
  loading?: boolean;
  /** 打开时轨道里的文字或图标（如“开”、对勾）；给了它或 uncheckedContent 时轨道随内容加宽 */
  checkedContent?: VNodeChild;
  /** 关闭时轨道里的文字或图标 */
  uncheckedContent?: VNodeChild;
  /** 字号档位；不写时继承上下文字号 */
  size?: TextSize;
  /** 打开时轨道的色调（与 Button、Badge 等同一套），默认 accent；可以用 defaults.Choice 统一改 */
  tone?: StatusTone;
  /** 外层 label 的部件属性 */
  propsRoot?: PartProps<'label'>;
  /** 叠放层的部件属性 */
  propsControl?: PartProps<'span'>;
  /** 滑块的部件属性 */
  propsThumb?: PartProps<'span'>;
  /** 轨道里文字（开、关两份）的部件属性 */
  propsContent?: PartProps<'span'>;
  /** 轨道里文字的内层（定字号、字重）的部件属性；改字号写这里，外层的内边距才仍按开关的字号算 */
  propsContentText?: PartProps<'span'>;
  /** 加载指示的部件属性 */
  propsSpinner?: Partial<SpinnerProps>;
  /** 文字的部件属性 */
  propsLabel?: PartProps<'span'>;
  /** 文字 */
  children?: VNodeChild;
}

/** Switch 的样式：track、trackWide、trackOff、thumb、thumbOn、content、contentOn、contentOff、contentHidden、contentText、spinner */
export const switchStyles = stylex.create({
  track: { width: '2.25em', height: '1.25em', borderRadius: '_full', borderColor: 'transparent' },
  // 轨道里有文字：宽度随文字（两份文字叠在同一格里，取较宽的，切换时宽度不跳）
  trackWide: { width: '_full', minWidth: '2.25em' },
  trackOff: { backgroundColor: '_borderStrong' },
  // 滑块靠起始边，打开后移到结束边：用逻辑方向的外边距，从右到左排版自动反过来
  thumb: {
    display: 'grid',
    placeItems: 'center',
    justifySelf: 'start',
    width: '0.875em',
    height: '0.875em',
    marginInlineStart: '0.1875em',
    borderRadius: '_full',
    backgroundColor: '_background',
    boxShadow: '_sm',
    transition: 'margin-inline-start _durations.sm _easings.standard',
  },
  // 移到结束边：百分比相对整条轨道，轨道随文字加宽时同样贴边
  thumbOn: { marginInlineStart: 'calc(100% - 1.0625em)', backgroundColor: 'var(--tone-on-fill)' },
  content: {
    gridArea: '1 / 1',
    justifySelf: 'stretch',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
  },
  // 文字在滑块的另一侧
  contentOn: {
    paddingInlineStart: '0.5em',
    paddingInlineEnd: '1.375em',
    color: 'var(--tone-on-fill)',
  },
  contentOff: { paddingInlineStart: '1.375em', paddingInlineEnd: '0.5em', color: '_text' },
  contentHidden: { visibility: 'hidden' },
  // 字号缩在里层：外层的内边距按开关的字号算，给滑块留的位置才够
  contentText: { fontSize: '_xs', fontWeight: '_semibold', lineHeight: 1 },
  spinner: { width: '0.75em', height: '0.75em', color: 'var(--tone-fill)' },
});

/** 开关：立即生效的开 / 关 */
export const Switch = _component(
  ({
    checked = _bindable(false),
    disabled,
    readonly,
    required,
    invalid,
    size,
    tone,
    loading = false,
    checkedContent,
    uncheckedContent,
    id,
    propsRoot,
    propsControl,
    propsThumb,
    propsContent,
    propsContentText,
    propsSpinner,
    propsLabel,
    children,
    ...rest
  }: SwitchProps) => {
    const control = useFieldControl(() => ({ id, invalid, required, disabled, readonly }));
    const appearance = useChoiceAppearance(() => ({ size, tone }));
    // 很快完成的切换不闪加载指示；点击拦截、aria-busy 按真实的 loading
    const spinner = useDelayedLoading(() => loading);
    return () => {
      const state = control();
      const wide = checkedContent != null || uncheckedContent != null;
      const content = (on: boolean, child: VNodeChild) => (
        <span
          {...mergeAttrs<'span'>(
            {
              sx: [
                switchStyles.content,
                on ? switchStyles.contentOn : switchStyles.contentOff,
                on !== checked && switchStyles.contentHidden,
              ],
            },
            propsContent,
            { 'aria-hidden': true },
          )}
        >
          <span {...mergeAttrs<'span'>({ sx: switchStyles.contentText }, propsContentText)}>
            {child}
          </span>
        </span>
      );
      return (
        <label
          {...mergeAttrs<'label'>(
            { sx: choiceRootSx(appearance(), state.disabled, state.readonly) },
            propsRoot,
          )}
          data-state={checked ? 'checked' : 'unchecked'}
          data-disabled={state.disabled || undefined}
          data-readonly={state.readonly || undefined}
          data-loading={loading || undefined}
        >
          <span {...mergeAttrs<'span'>({ sx: choiceStyles.control }, propsControl)}>
            <input
              {...mergeAttrs<'input'>(
                {
                  sx: [
                    choiceStyles.input,
                    focusRingStyles.tight,
                    switchStyles.track,
                    wide && switchStyles.trackWide,
                    checked ? choiceStyles.checked : switchStyles.trackOff,
                    state.invalid && choiceStyles.invalid,
                  ],
                },
                rest,
                {
                  type: 'checkbox',
                  role: 'switch',
                  id: state.id,
                  checked,
                  disabled: state.disabled,
                  required: state.required,
                  'aria-invalid': state.invalid || undefined,
                  'aria-readonly': state.readonly || undefined,
                  'aria-describedby': state.describedBy,
                  'aria-busy': loading || undefined,
                  // 切换中、只读时不接受切换：拦下 click，勾选状态就不变
                  onClick: (event: MouseEvent) => {
                    if (loading || state.readonly) event.preventDefault();
                  },
                  onChange: (event: Event) => {
                    const target = event.target as HTMLInputElement;
                    checked = target.checked;
                    syncChecked([target], () => checked);
                  },
                },
              )}
            />
            {wide && content(true, checkedContent)}
            {wide && content(false, uncheckedContent)}
            <span
              {...mergeAttrs<'span'>(
                { sx: [choiceStyles.mark, switchStyles.thumb, checked && switchStyles.thumbOn] },
                propsThumb,
              )}
            >
              {spinner.value && (
                <Spinner
                  {...mergePartProps<SpinnerProps>(
                    { propsIcon: { sx: switchStyles.spinner } },
                    propsSpinner,
                  )}
                />
              )}
            </span>
          </span>
          {children != null && (
            <span {...mergeAttrs<'span'>({ sx: choiceStyles.label }, propsLabel)}>{children}</span>
          )}
        </label>
      );
    };
  },
);
