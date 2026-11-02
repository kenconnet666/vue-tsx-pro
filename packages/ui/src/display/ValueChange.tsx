/**
 * 一个值的变化：原值划掉、箭头、新值。放在表格单元格、时间线、审批意见里，FieldCompare 的列表布局也用它。
 *
 *   <ValueChange before="¥1,200" after="¥1,350" />
 *   <ValueChange after="新建时只有新值" />
 *
 * 读屏：原值是 del、新值是 ins，两者之间有“改为”（画面上是箭头）。
 * 部件：Root（span）、Before（del）、Arrow（Icon）、After（ins）。
 */
import { ArrowRight } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { Icon, type IconProps } from '../base/Icon';
import { VisuallyHidden } from '../base/VisuallyHidden';
import { useLang } from '../config/context';
import { mergeAttrs, mergeProps, type PartProps } from '../utils/props';

/** 未声明的属性落到外层 span 上 */
export interface ValueChangeProps extends PartProps<'span'> {
  /** 原值；没有（null、undefined）时只显示新值 */
  before?: VNodeChild;
  /** 新值 */
  after?: VNodeChild;
  /** 原值（del）的部件属性 */
  propsBefore?: PartProps<'del'>;
  /** 箭头的部件属性 */
  propsArrow?: Partial<IconProps>;
  /** 新值（ins）的部件属性 */
  propsAfter?: PartProps<'ins'>;
}

/** ValueChange 的样式：root、before、arrow、after */
export const valueChangeStyles = css.create({
  root: {
    display: 'inline-flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    columnGap: '_xs',
    minWidth: 0,
  },
  before: { color: '_textMuted', textDecorationLine: 'line-through' },
  arrow: { alignSelf: 'center', color: '_textMuted', flexShrink: 0 },
  after: { textDecorationLine: 'none', color: '_text', fontWeight: '_medium' },
});

/** 一个值的变化 */
export const ValueChange = _component(
  ({ before, after, propsBefore, propsArrow, propsAfter, ...rest }: ValueChangeProps) => {
    const lang = useLang();
    return () => (
      <span {...mergeAttrs<'span'>({ sx: valueChangeStyles.root }, rest)}>
        {before != null && (
          <>
            <del {...mergeAttrs<'del'>({ sx: valueChangeStyles.before }, propsBefore)}>
              {before}
            </del>
            <Icon
              {...mergeProps<IconProps>({ sx: valueChangeStyles.arrow }, propsArrow)}
              icon={propsArrow?.icon ?? ArrowRight}
            />
            <VisuallyHidden>{lang.fieldCompareTo}</VisuallyHidden>
          </>
        )}
        <ins {...mergeAttrs<'ins'>({ sx: valueChangeStyles.after }, propsAfter)}>{after}</ins>
      </span>
    );
  },
);
