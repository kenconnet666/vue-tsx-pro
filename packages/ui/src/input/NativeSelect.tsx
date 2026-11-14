/**
 * 原生下拉框（select）：外观同其他输入框（外壳、尺寸、出错、相连），弹出的选项列表是浏览器、系统自己的——
 * 手机上是系统的滚轮或底部列表，读屏、键盘、自动填充都是原生的行为。
 *
 *   <NativeSelect _value={country} items={['中国', '日本', '韩国']} placeholder="选择国家" aria-label="国家" />
 *   <NativeSelect _value={status} items={[{ value: 'draft', label: '草稿' }, { value: 'done', label: '已完成', group: '结束' }]} />
 *
 * 和 Select 怎么选：选项要图标、说明、搜索、多选、远程加载，或者要和设计稿一样的弹出层，用 Select；
 * 选项只是一串文字、主要在手机上用、想要最稳的原生行为（表单自动填充、系统的选择器），用它。
 *
 * - 值是选项的 value（字符串），没选时是 null；placeholder 是第一条选不了的占位项。选项的 value 不能是空字符串。
 * - 带 group 的选项按组排进 optgroup；选项的 description、icon 原生的列表画不出来，不显示。
 * - 只读：原生 select 没有只读，这里让别的选项选不了、读屏念“只读”，值照常随表单提交。
 * - 点外壳的空白处（图标、箭头）也打开列表（浏览器支持 showPicker 时）。
 *
 * 部件：Root（外壳 div）、Input（select）、Icon（前置图标）、Chevron（箭头）。
 */
import { ChevronDown } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { Icon, type IconProps } from '../base/Icon';
import { t } from '../config/theme/tokens';
import { useFieldControl } from '../form/Field';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import {
  clickOnShell,
  controlIcon,
  controlParts,
  focusOnShell,
  useControlAppearance,
  type ControlIconOptions,
  type ControlOptions,
} from './control';
import type { ListboxOption } from './list-state';

/** 取值、选项与状态由组件管理 */
export type NativeSelectManaged =
  | 'value'
  | 'multiple'
  | 'size'
  | 'disabled'
  | 'required'
  | 'aria-invalid'
  | 'aria-readonly'
  | 'aria-describedby';

/** 未声明的属性落到 select 上；外壳用 propsRoot */
export interface NativeSelectProps
  extends PartProps<'select', NativeSelectManaged>, ControlOptions, ControlIconOptions {
  /** 选项：ListboxOption 或字符串（值与文字相同）；带 group 的排进 optgroup */
  items: readonly (ListboxOption | string)[];
  /** 选中的值：父级写 _value={x} 双向绑定；没选时是 null */
  _value?: string | null;
  /** 没选时显示的文字（第一条选不了的占位项）；不写时，没选的话浏览器显示第一项 */
  placeholder?: string;
  /** 不可用 */
  disabled?: boolean;
  /** 只读：能聚焦、能看，换不了 */
  readonly?: boolean;
  /** 必填 */
  required?: boolean;
  /** 校验未通过 */
  invalid?: boolean;
  /** 外壳（边框、焦点环）的部件属性 */
  propsRoot?: PartProps<'div'>;
  /** 箭头的部件属性 */
  propsChevron?: Partial<IconProps>;
}

/** NativeSelect 的样式：root、select、placeholder、chevron */
const nativeSelectStyles = css.create({
  root: { position: 'relative', cursor: 'pointer' },
  // 去掉浏览器的外观（各家的箭头、边框都不一样），箭头自己画；结束边留出箭头的位置。
  // 往结束边伸到外壳的边上：点箭头那一块也落在 select 上
  select: {
    appearance: 'none',
    cursor: 'pointer',
    marginInlineEnd: `calc(-1 * ${t.space.md})`,
    paddingInlineEnd: `calc(${t.space.md} + 1em + ${t.space.sm})`,
    textOverflow: 'ellipsis',
  },
  // 没选时显示的占位文字用占位色（浏览器不支持给 select 写 ::placeholder）
  placeholder: { color: '_textPlaceholder' },
  // 箭头叠在 select 上面，点击穿透到 select
  chevron: {
    position: 'absolute',
    insetInlineEnd: '_md',
    top: '50%',
    translate: '0 -50%',
    color: '_textMuted',
    pointerEvents: 'none',
  },
});

/** 按组排好的选项：没有组的在前，各组按第一次出现的顺序 */
function grouped(items: readonly (ListboxOption | string)[]) {
  const options = items.map((item) =>
    typeof item === 'string' ? { value: item, label: item } : item,
  );
  const groups = new Map<string | undefined, ListboxOption[]>();
  for (const option of options) {
    const list = groups.get(option.group);
    if (list) list.push(option);
    else groups.set(option.group, [option]);
  }
  return groups;
}

/** 原生下拉框：外壳同输入框，选项列表是系统的 */
export const NativeSelect = _component(
  ({
    items,
    _value: value = _bindable<string | null>(null),
    placeholder,
    variant,
    size,
    radius,
    disabled,
    readonly,
    required,
    invalid,
    icon,
    id,
    propsRoot,
    propsIcon,
    propsChevron,
    ...rest
  }: NativeSelectProps) => {
    const appearance = useControlAppearance(() => ({ variant, size, radius }));
    const control = useFieldControl(() => ({ id, invalid, required, disabled, readonly }));
    let select = _state.raw<HTMLSelectElement | null>(null);

    function onChange(event: Event) {
      const element = event.target as HTMLSelectElement;
      value = element.value || null;
      // 父级没接受新值（或改成了别的）时，原生的选中项不会自己回去：下一次渲染按 value 重新选
      element.value = value ?? '';
    }

    /** 打开系统的选项列表；不支持 showPicker 的浏览器只聚焦（按空格、方向键照常能选） */
    function open() {
      const state = control();
      if (state.disabled || state.readonly) return;
      try {
        select?.showPicker?.();
      } catch {
        // 不是用户操作触发、或在跨域的 iframe 里：浏览器不让打开，留在聚焦的状态
      }
    }

    return () => {
      const state = control();
      const s = controlParts(appearance(), state);
      const option = (item: ListboxOption) => (
        <option
          key={item.value}
          value={item.value}
          selected={item.value === value}
          // 只读：别的选项选不了，当前的值照常显示、照常提交
          disabled={item.disabled || (state.readonly && item.value !== value)}
        >
          {item.label}
        </option>
      );
      return (
        <div
          {...mergeAttrs<'div'>(
            { ...s.root, sx: [s.root.sx, nativeSelectStyles.root] },
            propsRoot,
            {
              onPointerdown: focusOnShell(() => select),
              onClick: clickOnShell(() => select, open),
            },
          )}
          data-invalid={state.invalid || undefined}
          data-disabled={state.disabled || undefined}
        >
          {controlIcon(s, icon, propsIcon)}
          <select
            {...mergeAttrs<'select'>(
              {
                ...s.input,
                sx: [
                  s.input.sx,
                  nativeSelectStyles.select,
                  value == null && nativeSelectStyles.placeholder,
                ],
              },
              rest,
              {
                ref: _toRef(select),
                id: state.id,
                disabled: state.disabled,
                required: state.required,
                'aria-invalid': state.invalid || undefined,
                'aria-readonly': state.readonly || undefined,
                'aria-describedby': state.describedBy,
                onChange,
              },
            )}
          >
            {placeholder != null && (
              // 占位项：选不了、不出现在列表里（hidden），没选时显示它
              <option value="" selected={value == null} disabled hidden>
                {placeholder}
              </option>
            )}
            {[...grouped(items)].map(([group, options]) =>
              group == null ? (
                options.map(option)
              ) : (
                <optgroup key={group} label={group}>
                  {options.map(option)}
                </optgroup>
              ),
            )}
          </select>
          <Icon
            {...mergePartProps<IconProps>(
              { icon: ChevronDown, sx: nativeSelectStyles.chevron },
              propsChevron,
            )}
          />
        </div>
      );
    };
  },
);
