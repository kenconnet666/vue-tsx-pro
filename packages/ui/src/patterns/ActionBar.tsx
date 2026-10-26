/**
 * 吸底的操作栏（div）：长表单、详情页底部的“取消 / 保存草稿 / 提交”，滚动时一直贴在滚动区域的底边，不用滚到底才能提交。
 *
 *   <ActionBar start={form.dirty ? '有未保存的改动' : undefined}>
 *     <Button variant="ghost" tone="neutral">取消</Button>
 *     <Button type="submit" loading={form.submitting}>提交</Button>
 *   </ActionBar>
 *
 * 放在要跟着滚动的内容的最后（表单里、卡片里、页面主区里都行）：position: sticky 贴着最近的滚动容器的底边。
 * 下面还有被盖住的内容时（贴在底边、还没滚到它原本的位置）带阴影、data-stuck，提示还能往下滚；滚到底时与内容平齐。
 * start 是起始边的说明（未保存的改动、校验汇总），children 是结束边的按钮。
 *
 * 部件：Root（div）、Start（div）、Actions（div）。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { useIntersectionObserver } from '../utils/dom/intersection';
import { hasContent, mergeAttrs, type PartProps } from '../utils/props';
import { t } from '../config/theme/tokens';

/** 未声明的属性落到外层 div 上 */
export interface ActionBarProps extends PartProps<'div'> {
  /** 起始边的内容：未保存的改动、已选几项、校验汇总 */
  start?: VNodeChild;
  /**
   * 贴在滚动区域的底边，默认 true；false 时是普通的一行（如对话框里已经固定的底栏）
   * @default true
   */
  sticky?: boolean;
  /** 起始边内容的部件属性 */
  propsStart?: PartProps<'div'>;
  /** 按钮区的部件属性 */
  propsActions?: PartProps<'div'>;
  /** 按钮：靠结束边排开 */
  children?: VNodeChild;
}

/** ActionBar 的样式：root、sticky、stuck、start、actions */
export const actionBarStyles = css.create({
  root: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '_md',
    paddingBlock: '_md',
    paddingInline: '_lg',
    borderBlockStartWidth: '_xs',
    borderBlockStartStyle: 'solid',
    borderBlockStartColor: '_borderMuted',
    backgroundColor: '_surface',
    transition: `box-shadow ${t.durations.md} ${t.easings.standard}`,
  },
  // 往下多出一条线宽：贴着底边时有 1px 在滚动区域外，交叉比例小于 1，据此判断“盖着下面的内容”
  sticky: { position: 'sticky', insetBlockEnd: `calc(-1 * ${t.borderWidths.xs})`, zIndex: 1 },
  // 盖着下面的内容：阴影提示还能往下滚
  stuck: { boxShadow: '_md', borderBlockStartColor: '_border' },
  // 说明文字比所在文字小一档（0.93em ≈ 默认字号下的 sm）
  start: { flexGrow: 1, minWidth: 0, color: '_textMuted', fontSize: '0.93em' },
  actions: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '_sm',
    marginInlineStart: 'auto',
  },
});

/** 吸底的操作栏：起始边的说明、结束边的按钮；盖着下面的内容时带阴影 */
export const ActionBar = _component(
  ({ start, sticky = true, propsStart, propsActions, children, ...rest }: ActionBarProps) => {
    let root = _state.raw<HTMLElement | null>(null);
    let stuck = _state(false);

    // 贴着底边时栏有一条线宽露在滚动区域外（见 sticky 样式）：没有完整可见就是盖着下面的内容
    useIntersectionObserver(
      () => (sticky ? root : null),
      ([entry]) => (stuck = !!entry && entry.isIntersecting && entry.intersectionRatio < 1),
      () => ({ threshold: [0, 1] }),
    );

    return () => (
      <div
        {...mergeAttrs<'div'>(
          {
            sx: [
              actionBarStyles.root,
              sticky && actionBarStyles.sticky,
              sticky && stuck && actionBarStyles.stuck,
            ],
          },
          rest,
          { ref: _toRef(root) },
        )}
        data-stuck={(sticky && stuck) || undefined}
      >
        {hasContent(start) && (
          <div {...mergeAttrs<'div'>({ sx: actionBarStyles.start }, propsStart)}>{start}</div>
        )}
        <div {...mergeAttrs<'div'>({ sx: actionBarStyles.actions }, propsActions)}>{children}</div>
      </div>
    );
  },
);
