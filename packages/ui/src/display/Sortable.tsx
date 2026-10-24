/**
 * 可拖动排序的列表（ul）：每项前有一个把手，拖动或用键盘改变顺序，数据双向绑定。
 *
 *   <Sortable items={_bind(tasks)} getKey={(task) => task.id} getLabel={(task) => task.title} aria-label="待办">
 *     {(task) => <Text>{task.title}</Text>}
 *   </Sortable>
 *
 * 拖动、键盘、读屏播报、自动滚动、布局动画见 useSortable（utils/dom/sortable.ts）。
 * 列表自己不滚动：项多时在外面包 ScrollArea（横排写 axis="x"），拖到边缘时自动滚动会找到它的视口，滚动条与整站一致。
 * 把手是按钮：名称“移动 项名”，操作说明经 aria-describedby 关联，拿起时 aria-pressed。
 * 部件：Root（ul）、Item（li）、Handle（button）、Content（div）。
 */
import { GripVertical } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import type { VNodeChild } from 'vue';
import { ButtonBase, type ButtonBaseProps } from '../base/ButtonBase';
import { Icon } from '../base/Icon';
import { VisuallyHidden } from '../base/VisuallyHidden';
import { useLang } from '../config/context';
import { useSortable, type SortableOrientations } from '../utils/dom/sortable';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { FlexList, type FlexProps } from '../layout/Flex';
import { toElement } from '../utils/dom/element';
import { t } from '../config/theme/tokens';

/** 项的渲染状态 */
export interface SortableItemState {
  /** 当前位置，从 0 开始 */
  index: number;
  /** 正在被拖动或被键盘拿起 */
  active: boolean;
}

/** 未声明的属性落到 ul 上；aria-label 或 aria-labelledby 是列表的名称 */
export interface SortableProps<T> extends PartProps<'ul'> {
  /** 各项：父级写 items={_bind(list)}，顺序变了写回新的数组 */
  items?: T[];
  /** 项的 key，同一列表里唯一 */
  getKey: (item: T) => string;
  /** 项的名称：把手的名称与读屏播报用它；默认是 key */
  getLabel?: (item: T) => string;
  /** 排列方向，默认 vertical */
  orientation?: keyof SortableOrientations;
  /** 不可用：不能拖动 */
  disabled?: boolean;
  /** 每项的内容 */
  children?: (item: T, state: SortableItemState) => VNodeChild;
  /** 每一项（li）的部件属性，可以按项计算 */
  propsItem?: PartProps<'li'> | ((item: T, state: SortableItemState) => PartProps<'li'>);
  /** 把手的部件属性 */
  propsHandle?: Partial<ButtonBaseProps>;
  /** 内容的部件属性 */
  propsContent?: PartProps<'div'>;
}

/** Sortable 的样式：item、active、handle、content */
export const sortableStyles = css.create({
  // 方向、间距、去掉圆点由 FlexList 给
  item: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: '_sm',
    paddingBlock: '_xs',
    // 起始边是把手（自带留白），结束边多留一点，文字不贴着边框
    paddingInlineStart: '_xs',
    paddingInlineEnd: '_sm',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_borderMuted',
    borderRadius: '_md',
    backgroundColor: '_surface',
    color: '_text',
  },
  // 横排时项不收缩：放不下就溢出（外面包 ScrollArea 横向滚动），不把文字挤成一字一行
  itemHorizontal: { flexShrink: 0 },
  // 拿起时浮起来：阴影与品牌色边框，盖在其他项上面
  active: { zIndex: 1, borderColor: '_accent', boxShadow: '_md' },
  // 去掉按钮默认外观、焦点环由 ButtonBase 给出
  handle: {
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
    width: `max(1.75em, ${t.sizes.minTarget})`,
    height: `max(1.75em, ${t.sizes.minTarget})`,
    borderRadius: '_sm',
    backgroundColor: { default: 'transparent', ':hover': '_fillHover' },
    color: '_textMuted',
    cursor: { default: 'grab', ':active': 'grabbing' },
    // 触摸拖动时不滚动页面
    touchAction: 'none',
  },
  content: { flexGrow: 1, minWidth: 0 },
});

/** 可拖动排序的列表：把手拖动或键盘移动 */
export const Sortable = _component(
  <T,>({
    items = _bindable<T[]>([]),
    getKey,
    getLabel,
    orientation = 'vertical',
    disabled = false,
    children,
    propsItem,
    propsHandle,
    propsContent,
    ...rest
  }: SortableProps<T>) => {
    const lang = useLang();
    let root = _state.raw<HTMLElement | null>(null);
    const sortable = useSortable<T>({
      items: () => items,
      getKey: (item) => getKey(item),
      getLabel: (item) => getLabel?.(item) ?? getKey(item),
      onChange: (next) => (items = next),
      container: () => root,
      orientation: () => orientation,
      disabled: () => disabled,
    });

    return () => (
      <>
        <FlexList
          {...mergePartProps<FlexProps<'ul'>>(
            {
              direction: orientation === 'horizontal' ? 'row' : 'column',
              gap: 'xs',
            },
            rest,
            { ref: (value: unknown) => (root = toElement(value)) },
          )}
          data-orientation={orientation}
        >
          {items.map((item, index) => {
            const key = getKey(item);
            const state: SortableItemState = { index, active: sortable.active === key };
            const own = typeof propsItem === 'function' ? propsItem(item, state) : propsItem;
            return (
              <li
                key={key}
                {...mergeAttrs<'li'>(
                  {
                    sx: [
                      sortableStyles.item,
                      orientation === 'horizontal' && sortableStyles.itemHorizontal,
                      state.active && sortableStyles.active,
                    ],
                  },
                  own,
                  sortable.itemProps(key),
                )}
              >
                <ButtonBase
                  {...mergePartProps<ButtonBaseProps>(
                    // 拖动的把手不出波纹
                    { sx: sortableStyles.handle, ripple: false },
                    propsHandle,
                    {
                      disabled,
                      'aria-label': lang.sortableHandle(getLabel?.(item) ?? key),
                      ...sortable.handleProps(key),
                    },
                  )}
                >
                  <Icon icon={GripVertical} />
                </ButtonBase>
                <div {...mergeAttrs<'div'>({ sx: sortableStyles.content }, propsContent)}>
                  {children?.(item, state)}
                </div>
              </li>
            );
          })}
        </FlexList>
        <VisuallyHidden id={sortable.instructionsId}>{lang.sortableInstructions}</VisuallyHidden>
        <VisuallyHidden aria-live="assertive">{sortable.announcement}</VisuallyHidden>
      </>
    );
  },
  { name: 'Sortable' },
);
