/**
 * 批量操作栏（div）：表格勾选了行之后出现在表格上方，“已选 N 项 · 取消选择”，结束边是批量操作。
 *
 *   <SelectionBar count={selected.length} onClear={() => (selected = [])}>
 *     <Button size="sm" variant="outline" tone="neutral">批量导出</Button>
 *     <Button size="sm" tone="danger" variant="soft">批量删除</Button>
 *   </SelectionBar>
 *
 * count 为 0 时不显示（淡出）；已选的数目在读屏的播报区里，勾选变化时念出来。
 * 部件：Root（div）、Count（span）、Clear（Button）、Actions（div）。数目变化经共用的播报区（announce）念出。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { watch, type VNodeChild } from 'vue';
import { Button, type ButtonProps } from '../base/Button';
import { useLang } from '../config/context';
import { announce } from '../utils/dom/announcer';
import { usePresence } from '../utils/motion/presence';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { presenceStyles } from '../utils/style/transitions';

/** 未声明的属性落到外层 div 上 */
export interface SelectionBarProps extends PartProps<'div'> {
  /** 已选几项；0 时不显示 */
  count: number;
  /** 点“取消选择”：清空选择由使用方做 */
  onClear?: () => void;
  /** 已选数目的文字，默认取语言包（已选 N 项）：跨页全选时写“已选全部 1,286 项” */
  label?: VNodeChild;
  /** 已选数目的部件属性 */
  propsCount?: PartProps<'span'>;
  /** 取消选择按钮的部件属性 */
  propsClear?: Partial<ButtonProps>;
  /** 批量操作区的部件属性 */
  propsActions?: PartProps<'div'>;
  /** 批量操作的按钮 */
  children?: VNodeChild;
}

/** SelectionBar 的样式：root、count、actions */
export const selectionBarStyles = css.create({
  root: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '_md',
    minHeight: '_control',
    paddingBlock: '_xs',
    paddingInline: '_md',
    borderRadius: '_md',
    backgroundColor: '_accentSoft',
    color: '_text',
    fontSize: '_sm',
  },
  count: { fontWeight: '_semibold', color: '_accentText', fontVariantNumeric: 'tabular-nums' },
  actions: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '_sm',
    marginInlineStart: 'auto',
  },
});

/** 批量操作栏：已选几项、取消选择、批量操作；没有选择时淡出 */
export const SelectionBar = _component(
  ({
    count,
    onClear,
    label,
    propsCount,
    propsClear,
    propsActions,
    children,
    ...rest
  }: SelectionBarProps) => {
    const lang = useLang();
    // 数目变了给读屏播报：栏是随第一次选择一起出现的，挂在它里面的 aria-live 区域第一句念不出来
    // 给了文字的 label（“已选全部 1,286 项”）就念它
    watch(
      () => [count, label] as const,
      ([next, text]) => announce(typeof text === 'string' ? text : lang.tableSelectedCount(next)),
    );
    // 数目变成 0 后等淡出结束再卸载；淡出时仍显示最后的数目，不闪成“已选 0 项”
    const presence = usePresence(() => count > 0);
    let shownCount = _untrack(count);
    return () => {
      if (count > 0) shownCount = count;
      return (
        presence.mounted && (
          <div
            {...mergeAttrs<'div'>(
              {
                sx: [
                  selectionBarStyles.root,
                  presenceStyles.fade,
                  presence.state === 'closed' && presenceStyles.leaving,
                ],
              },
              rest,
              { ref: presence.ref },
            )}
            data-state={presence.state}
          >
            <span {...mergeAttrs<'span'>({ sx: selectionBarStyles.count }, propsCount)}>
              {label ?? lang.tableSelectedCount(shownCount)}
            </span>
            <Button
              {...mergePartProps<ButtonProps>({ variant: 'link', size: 'sm' }, propsClear, {
                onClick: () => onClear?.(),
              })}
            >
              {lang.tableClearSelection}
            </Button>
            <div {...mergeAttrs<'div'>({ sx: selectionBarStyles.actions }, propsActions)}>
              {children}
            </div>
          </div>
        )
      );
    };
  },
);
