/**
 * 单元格与单元格分组：列表、设置页、表单的一行——左边标题（可带图标与说明），右边值，可带箭头、可点击。
 *
 *   <CellGroup title="账户" inset>
 *     <Cell title="昵称" value="莱恩" arrow onClick={edit} />
 *     <Cell title="手机号" description="用于登录与找回密码" value="138****0000" />
 *   </CellGroup>
 *
 * 单元格之间的细线从左边内边距处开始，最后一个不画；inset 的分组是浮在灰底上的圆角卡片。
 */
import { ChevronDown, ChevronRight, ChevronUp } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { Icon, type IconData, type IconProps } from '../base/Icon';
import { dividerImage, dividerLayout } from '../theme/divider';
import { dataAttrs, hasContent, mergeAttrs, mergePartProps, type PartProps } from '../utils/props';

/** 箭头的方向 */
export interface CellArrows {
  /** 向右：进入下一页 */
  right: unknown;
  /** 向下：展开 */
  down: unknown;
  /** 向上：收起 */
  up: unknown;
}

/** 未声明的属性落到根元素（div）上；title 是标题内容，不是元素的 title 属性 */
export interface CellProps extends PartProps<'div', 'role' | 'title'> {
  /** 标题 */
  title?: VNodeChild;
  /** 标题下的说明 */
  description?: VNodeChild;
  /** 右边的值；也可以写在 children 里 */
  value?: VNodeChild;
  /** 标题前的图标 */
  icon?: IconData;
  /** 右边的箭头：true 是向右，也可以给方向 */
  arrow?: boolean | keyof CellArrows;
  /** 可点击：按下有反馈；有 onClick 或 arrow 时自动是可点击的 */
  clickable?: boolean;
  /** 标题前加红色星号（必填） */
  required?: boolean;
  /** 内容垂直居中（默认顶端对齐，说明多行时标题与值仍在第一行） */
  center?: boolean;
  /**
   * 尺寸：lg 用在大号的列表项
   * @default 'md'
   */
  size?: 'md' | 'lg';
  /** 不画下面的细线 */
  noDivider?: boolean;
  /** 右边的值（与 value 二选一） */
  children?: VNodeChild;
  /** 图标的部件属性 */
  propsIcon?: Partial<IconProps>;
  /** 标题与说明那一栏的部件属性 */
  propsBody?: PartProps<'div'>;
  /** 标题的部件属性 */
  propsTitle?: PartProps<'div'>;
  /** 说明的部件属性 */
  propsDescription?: PartProps<'div'>;
  /** 值的部件属性 */
  propsValue?: PartProps<'div'>;
  /** 箭头的部件属性 */
  propsArrow?: Partial<IconProps>;
}

/** Cell 的样式：root、clickable、center、lg、icon、body、title、required、description、value、arrow */
export const cellStyles = css.create({
  root: {
    boxSizing: 'border-box',
    position: 'relative',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '_md',
    width: '100%',
    minHeight: '_control',
    paddingBlock: '0.7em',
    paddingInline: '_lg',
    fontSize: '_md',
    lineHeight: '1.5',
    color: '_text',
    backgroundColor: '_surface',
    // 细线：从左边内边距处画到右边，最后一个不画（不用伪元素：小程序把样式展开成行内样式，伪元素进不去）
    backgroundImage: {
      default: dividerImage,
      ':last-child': 'none',
      '[data-no-divider]': 'none',
    },
    ...dividerLayout,
  },
  clickable: {
    cursor: 'pointer',
    userSelect: 'none',
    backgroundColor: { default: '_surface', ':active': '_fillActive' },
    transitionProperty: 'background-color',
    transitionDuration: '_xs',
  },
  center: { alignItems: 'center' },
  lg: { minHeight: '3.5em', paddingBlock: '0.9em', fontSize: '_lg' },
  icon: { fontSize: '1.15em', marginBlockStart: '0.15em', color: '_text' },
  body: { flex: '1 1 auto', minWidth: 0 },
  title: { overflowWrap: 'anywhere' },
  required: { color: '_dangerText', marginInlineEnd: '0.15em' },
  description: { marginBlockStart: '0.15em', fontSize: '_xs', color: '_textMuted' },
  value: {
    flex: '0 1 auto',
    maxWidth: '60%',
    color: '_textMuted',
    textAlign: 'end',
    overflowWrap: 'anywhere',
  },
  arrow: {
    fontSize: '1.1em',
    marginBlockStart: '0.2em',
    marginInlineStart: '-0.25em',
    color: '_textPlaceholder',
  },
});

const ARROWS = { right: ChevronRight, down: ChevronDown, up: ChevronUp } as const;

/** 单元格（div）：可点击时 role="button" */
export const Cell = _component(
  ({
    title,
    description,
    value,
    icon,
    arrow = false,
    clickable,
    required = false,
    center = false,
    size = 'md',
    noDivider = false,
    children,
    propsIcon,
    propsBody,
    propsTitle,
    propsDescription,
    propsValue,
    propsArrow,
    ...rest
  }: CellProps) =>
    () => {
      const pressable = clickable ?? (arrow !== false || rest.onClick != null);
      const content = hasContent(value) ? value : children;
      return (
        <div
          {...mergeAttrs<'div'>(
            {
              sx: [
                cellStyles.root,
                pressable && cellStyles.clickable,
                center && cellStyles.center,
                size === 'lg' && cellStyles.lg,
              ],
            },
            rest,
            {
              role: pressable ? 'button' : undefined,
              ...dataAttrs({ 'data-no-divider': noDivider || undefined }),
            },
          )}
        >
          {icon && (
            <Icon {...mergePartProps<IconProps>({ icon, sx: cellStyles.icon }, propsIcon)} />
          )}
          {(hasContent(title) || hasContent(description)) && (
            <div {...mergeAttrs<'div'>({ sx: cellStyles.body }, propsBody)}>
              {hasContent(title) && (
                <div {...mergeAttrs<'div'>({ sx: cellStyles.title }, propsTitle)}>
                  {required && (
                    <span
                      {...mergeAttrs<'span'>({ sx: cellStyles.required }, undefined, {
                        'aria-hidden': 'true',
                      })}
                    >
                      *
                    </span>
                  )}
                  {title}
                </div>
              )}
              {hasContent(description) && (
                <div {...mergeAttrs<'div'>({ sx: cellStyles.description }, propsDescription)}>
                  {description}
                </div>
              )}
            </div>
          )}
          {hasContent(content) && (
            <div {...mergeAttrs<'div'>({ sx: cellStyles.value }, propsValue)}>{content}</div>
          )}
          {arrow !== false && (
            <Icon
              {...mergePartProps<IconProps>(
                { icon: ARROWS[arrow === true ? 'right' : arrow], sx: cellStyles.arrow },
                propsArrow,
              )}
            />
          )}
        </div>
      );
    },
);

/** 未声明的属性落到根元素（div）上；title 是分组标题，不是元素的 title 属性 */
export interface CellGroupProps extends PartProps<'div', 'title'> {
  /** 分组标题，在卡片上方 */
  title?: VNodeChild;
  /** 卡片样式：左右留边、圆角，浮在页面的灰底上 */
  inset?: boolean;
  /** 单元格 */
  children?: VNodeChild;
  /** 标题的部件属性 */
  propsTitle?: PartProps<'div'>;
  /** 包着单元格的那一层的部件属性 */
  propsBody?: PartProps<'div'>;
}

/** CellGroup 的样式：root、title、insetTitle、body、insetBody */
export const cellGroupStyles = css.create({
  root: { boxSizing: 'border-box' },
  title: {
    paddingInline: '_lg',
    paddingBlockStart: '_lg',
    paddingBlockEnd: '_sm',
    fontSize: '_sm',
    lineHeight: '1.4',
    color: '_textMuted',
  },
  insetTitle: { paddingInline: '1.75em' },
  body: { backgroundColor: '_surface' },
  insetBody: { marginInline: '_lg', borderRadius: '_lg', overflow: 'hidden' },
});

/** 单元格分组（div > 标题 + 单元格） */
export const CellGroup = _component(
  ({ title, inset = false, children, propsTitle, propsBody, ...rest }: CellGroupProps) =>
    () => (
      <div {...mergeAttrs<'div'>({ sx: cellGroupStyles.root }, rest)}>
        {hasContent(title) && (
          <div
            {...mergeAttrs<'div'>(
              { sx: [cellGroupStyles.title, inset && cellGroupStyles.insetTitle] },
              propsTitle,
            )}
          >
            {title}
          </div>
        )}
        <div
          {...mergeAttrs<'div'>(
            { sx: [cellGroupStyles.body, inset && cellGroupStyles.insetBody] },
            propsBody,
          )}
        >
          {children}
        </div>
      </div>
    ),
);
