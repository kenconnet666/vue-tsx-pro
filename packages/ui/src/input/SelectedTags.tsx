/**
 * 多选下拉的触发按钮前面那一排已选标签：Select、TreeSelect 共用。
 *
 *   <SelectedTags tags={selected} maxTagCount="responsive" onRemove={(value) => remove(value)} />
 *
 * 标签不能放进触发按钮里（按钮里不能有按钮），所以排在它前面。这排标签只给指针用：aria-hidden、移除按钮不进 Tab 顺序、
 * 按下时不抢焦点；读屏从触发按钮里念全部已选（lang.selectSummary），键盘在列表里取消勾选，或在触发按钮上按 Backspace。
 * maxTagCount 是数字时只显示前几个，'responsive' 时排成一行按宽度放（useOverflowItems），其余收进“+N”。
 * 未声明的属性落到这一排的 span 上。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { Tag, type TagProps } from '../base/Tag';
import { useLang } from '../config/context';
import { useOverflowItems } from '../utils/dom/overflow';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';

/** 一个已选的标签 */
export interface SelectedTag {
  /** 值：移除时交给 onRemove */
  value: string;
  /** 显示的文字 */
  label: string;
}

/** 未声明的属性落到这一排的 span 上 */
export interface SelectedTagsProps extends PartProps<'span', 'aria-hidden'> {
  /** 要显示的标签 */
  tags: readonly SelectedTag[];
  /** 最多显示几个，其余收进“+N”；'responsive' 时排成一行、按宽度放 */
  maxTagCount?: number | 'responsive';
  /** 点标签的移除按钮；不写时（只读、不可用）标签没有移除按钮 */
  onRemove?: (value: string) => void;
  /** 每个标签的部件属性 */
  propsTag?: Partial<TagProps>;
}

/** SelectedTags 的样式：root、line */
export const selectedTagsStyles = css.create({
  // 占触发框里剩下的宽度；触发按钮里只剩读屏用的文字
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '_xs',
    flexGrow: 1,
    minWidth: 0,
    paddingBlock: '_xs',
  },
  // responsive：一行，放不下的移出排版（useOverflowItems 要求容器 position: relative）；
  // contain: inline-size 让这一行不按内容撑宽外壳（不然按内容宽度排版的祖先会被整行标签撑开，永远“放得下”）
  line: { flexWrap: 'nowrap', position: 'relative', overflow: 'hidden', contain: 'inline-size' },
});

/** 移除按钮按下时不抢焦点：焦点留在触发按钮上 */
const keepFocus = (event: PointerEvent) => event.preventDefault();

/** 多选下拉的已选标签：可移除，可按数量或宽度收起 */
export const SelectedTags = _component(
  ({ tags, maxTagCount, onRemove, propsTag, ...rest }: SelectedTagsProps) => {
    const lang = useLang();
    let row = _state.raw<HTMLElement | null>(null);
    const overflow = useOverflowItems({
      container: () => (maxTagCount === 'responsive' ? row : null),
      count: () => tags.length,
      min: () => 1,
    });
    return () => {
      const responsive = maxTagCount === 'responsive';
      const shown =
        typeof maxTagCount === 'number' ? tags.slice(0, Math.max(0, maxTagCount)) : tags;
      const hiddenCount = responsive ? overflow.hidden : tags.length - shown.length;
      return (
        <span
          {...mergeAttrs<'span'>(
            { sx: [selectedTagsStyles.root, responsive && selectedTagsStyles.line] },
            rest,
            { ref: _toRef(row), 'aria-hidden': 'true' },
          )}
        >
          {shown.map((tag, index) => (
            <Tag
              key={tag.value}
              {...mergePartProps<TagProps>(
                {
                  size: 'sm',
                  variant: 'soft',
                  onRemove: onRemove && (() => onRemove(tag.value)),
                  propsRemove: { tabindex: -1, onPointerdown: keepFocus },
                },
                propsTag,
              )}
              {...(responsive ? overflow.itemProps(index) : {})}
            >
              {tag.label}
            </Tag>
          ))}
          {/* responsive 时“+N”一直在（没有折起的项时藏起来，但仍要量它的宽度） */}
          {(responsive || hiddenCount > 0) && (
            <Tag size="sm" variant="soft" {...(responsive ? overflow.restProps() : {})}>
              {lang.selectMoreTags(hiddenCount)}
            </Tag>
          )}
        </span>
      );
    };
  },
);
