/**
 * 分隔线：把内容分成几段；可在线上放文字（居中或靠一边）。
 *
 *   <Divider />
 *   <Divider>以下为历史订单</Divider>
 *   <Divider align="start" dashed>备注</Divider>
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { hasContent, mergeAttrs, type PartProps } from '../utils/props';

/** 文字的位置 */
export interface DividerAligns {
  /** 靠起始边 */
  start: unknown;
  /** 居中 */
  center: unknown;
  /** 靠结束边 */
  end: unknown;
}

/** 未声明的属性落到根元素（div）上 */
export interface DividerProps extends PartProps<'div', 'role'> {
  /** 线上的文字 */
  children?: VNodeChild;
  /**
   * 文字的位置
   * @default 'center'
   */
  align?: keyof DividerAligns;
  /** 虚线 */
  dashed?: boolean;
}

/** Divider 的样式：root、line、shortLine、dashed、text */
export const dividerStyles = css.create({
  root: {
    display: 'flex',
    alignItems: 'center',
    gap: '_lg',
    marginBlock: '_lg',
    // 与单元格、分组标题的左右留白对齐
    paddingInline: '_lg',
    fontSize: '_sm',
    color: '_textMuted',
  },
  line: {
    flex: '1 1 0',
    borderBlockStartWidth: '_hairline',
    borderBlockStartStyle: 'solid',
    borderBlockStartColor: '_border',
  },
  // 文字靠边时那一侧的线短一截
  shortLine: { flex: '0 0 10%' },
  dashed: { borderBlockStartStyle: 'dashed' },
  text: { flex: '0 0 auto' },
});

/** 分隔线（div[role=separator] > 线 + 文字 + 线） */
export const Divider = _component(
  ({ children, align = 'center', dashed = false, ...rest }: DividerProps) =>
    () => {
      const line = (short: boolean) => (
        <div
          {...mergeAttrs<'div'>({
            sx: [
              dividerStyles.line,
              short && dividerStyles.shortLine,
              dashed && dividerStyles.dashed,
            ],
          })}
        />
      );
      const labelled = hasContent(children);
      return (
        <div {...mergeAttrs<'div'>({ sx: dividerStyles.root }, rest, { role: 'separator' })}>
          {line(labelled && align === 'start')}
          {labelled && <span {...mergeAttrs<'span'>({ sx: dividerStyles.text })}>{children}</span>}
          {labelled && line(align === 'end')}
        </div>
      );
    },
);
