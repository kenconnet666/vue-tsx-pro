/**
 * 级联选择：一级级往下选（省 → 市 → 区），上面一排标签显示每一级选了什么（点标签回到那一级重选），下面是当前这一级的选项。
 * 选到没有下一级的项时完成。常放在底部弹出层里。
 *
 *   <Cascader title="所在地区" options={areaOptions()} _value={code} onFinish={({ selectedOptions }) => …} onClose={…} />
 *
 * _value 是最后一级的值；给了时按它找回整条路径。
 */
import { Check, X } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { Icon } from '../base/Icon';
import { useConfig } from '../config/context';
import { dataAttrs, hasContent, mergeAttrs, type PartProps } from '../utils/props';
import type { PickerOption } from './PickerColumn';

/** 选择的结果 */
export interface CascaderResult {
  /** 最后一级的值 */
  value: string | number;
  /** 一路选的各级选项 */
  selectedOptions: PickerOption[];
}

/** 未声明的属性落到根元素（div）上 */
export interface CascaderProps extends Omit<PartProps<'div', 'title' | 'placeholder'>, 'onChange'> {
  /** 选项树（选项带 children 时有下一级） */
  options: PickerOption[];
  /** 最后一级选中的值；双向绑定写 `_value={x}` */
  _value?: string | number;
  /** 标题 */
  title?: VNodeChild;
  /** 还没选的那一级标签上的文字；不给时用语言包的“请选择” */
  placeholder?: VNodeChild;
  /**
   * 右上角的关闭按钮
   * @default true
   */
  closeable?: boolean;
  /** 选了某一级的一项 */
  onChange?: (result: CascaderResult & { tabIndex: number }) => void;
  /** 选到了最后一级 */
  onFinish?: (result: CascaderResult) => void;
  /** 点了关闭 */
  onClose?: () => void;
}

/** Cascader 的样式 */
export const cascaderStyles = css.create({
  root: { backgroundColor: '_surface', userSelect: 'none' },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '3em',
    paddingInline: '_lg',
  },
  title: { fontSize: '_lg', fontWeight: '_semibold', color: '_text' },
  close: {
    display: 'inline-flex',
    margin: 0,
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    color: '_textMuted',
    fontSize: '_xl',
    cursor: 'pointer',
  },
  tabs: {
    display: 'flex',
    gap: '_lg',
    overflowX: 'auto',
    paddingInline: '_lg',
    borderBlockEndWidth: '_hairline',
    borderBlockEndStyle: 'solid',
    borderBlockEndColor: '_border',
    scrollbarWidth: 'none',
  },
  tab: {
    position: 'relative',
    flex: 'none',
    maxWidth: '8em',
    height: '2.6em',
    margin: 0,
    padding: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    color: { default: '_text', '[data-empty]': '_textMuted' },
    fontFamily: 'inherit',
    fontSize: '_md',
    fontWeight: { default: '_normal', '[aria-selected="true"]': '_semibold' },
    cursor: 'pointer',
    // 当前一级的下划线（背景渐变画在底部，不用伪元素）
    backgroundImage: {
      default: 'none',
      '[aria-selected="true"]': 'linear-gradient(currentColor, currentColor)',
    },
    backgroundSize: '1.6em 0.2em',
    backgroundPosition: 'center bottom',
    backgroundRepeat: 'no-repeat',
  },
  list: { height: '22em', overflowY: 'auto', paddingBlock: '_sm' },
  option: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBlock: '0.65em',
    paddingInline: '_lg',
    fontSize: '_md',
    color: {
      default: '_text',
      '[aria-selected="true"]': '_accentText',
      '[data-disabled]': '_textDisabled',
    },
    backgroundColor: { default: 'transparent', ':active:not([data-disabled])': '_fillActive' },
    cursor: { default: 'pointer', '[data-disabled]': 'not-allowed' },
  },
});

/** 在选项树里找到值为 value 的项，返回一路上的选项 */
export function findPath(
  options: PickerOption[],
  value: string | number | undefined,
): PickerOption[] {
  if (value === undefined) return [];
  for (const option of options) {
    if (option.value === value) return [option];
    const rest = findPath(option.children ?? [], value);
    if (rest.length) return [option, ...rest];
  }
  return [];
}

/** 级联选择（div > 标题栏 + 各级标签 + 当前一级的选项） */
export const Cascader = _component(
  ({
    options,
    _value: value = _bindable<string | number | undefined>(undefined),
    title,
    placeholder,
    closeable = true,
    onChange,
    onFinish,
    onClose,
    ...rest
  }: CascaderProps) => {
    const config = useConfig();
    // 一路选的项：按 _value 找回，选的过程中覆盖；外面改了 _value 时重新跟随
    let path = _derived(findPath(options, value));
    // 当前的一级：默认是最后选的那一级，点标签、选了有下一级的项时覆盖
    let tab = _derived(Math.max(0, path.length - 1));
    /** 第 level 级的选项 */
    const levelOptions = (level: number) =>
      level === 0 ? options : (path[level - 1]?.children ?? []);
    const choose = (level: number, option: PickerOption) => {
      if (option.disabled) return;
      path = [...path.slice(0, level), option];
      const result = { value: option.value, selectedOptions: path };
      onChange?.({ ...result, tabIndex: level });
      if (option.children?.length) tab = level + 1;
      else {
        value = option.value;
        onFinish?.(result);
      }
    };

    return () => {
      // 标签：选过的各级，加上还没选的下一级
      const levels =
        path.length + (path[path.length - 1]?.children?.length || !path.length ? 1 : 0);
      return (
        <div {...mergeAttrs<'div'>({ sx: cascaderStyles.root }, rest)}>
          <div {...mergeAttrs<'div'>({ sx: cascaderStyles.header })}>
            <span {...mergeAttrs<'span'>({ sx: cascaderStyles.title })}>
              {hasContent(title) ? title : null}
            </span>
            {closeable && (
              <button
                {...mergeAttrs<'button'>({ sx: cascaderStyles.close })}
                type="button"
                aria-label={config.lang.close}
                onClick={() => onClose?.()}
              >
                <Icon icon={X} />
              </button>
            )}
          </div>
          <div {...mergeAttrs<'div'>({ sx: cascaderStyles.tabs })} role="tablist">
            {Array.from({ length: levels }, (_, level) => (
              <button
                {...mergeAttrs<'button'>({ sx: cascaderStyles.tab })}
                type="button"
                role="tab"
                aria-selected={level === tab ? 'true' : 'false'}
                {...dataAttrs({ 'data-empty': !path[level] })}
                onClick={() => (tab = level)}
              >
                {path[level]?.text ?? placeholder ?? config.lang.select}
              </button>
            ))}
          </div>
          <div {...mergeAttrs<'div'>({ sx: cascaderStyles.list })} role="listbox">
            {levelOptions(tab).map((option) => {
              const selected = path[tab]?.value === option.value;
              return (
                <div
                  {...mergeAttrs<'div'>({ sx: cascaderStyles.option })}
                  role="option"
                  aria-selected={selected ? 'true' : 'false'}
                  aria-disabled={option.disabled ? 'true' : undefined}
                  {...dataAttrs({ 'data-disabled': option.disabled })}
                  onClick={() => choose(tab, option)}
                >
                  <span>{option.text}</span>
                  {selected && <Icon icon={Check} />}
                </div>
              );
            })}
          </div>
        </div>
      );
    };
  },
);
