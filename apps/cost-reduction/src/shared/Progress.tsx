/**
 * 完成情况的几种写法：一排圆点（表格的格子里，里程碑、实施节点）、一排清单（详情行里，带日期与证据）、
 * 带标题的一段（详情行的各段：进度写在标题里）
 */
import { CircleCheck, CircleDashed } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { Icon, listStyles, Small } from '@vue-tsx-pro/ui';
import type { VNodeChild } from 'vue';

const styles = stylex.create({
  dots: { display: 'inline-flex', alignItems: 'center', gap: '2px' },
  done: { color: '_successText' },
  todo: { color: '_textMuted' },
  checklist: { display: 'flex', flexWrap: 'wrap', columnGap: '_lg', rowGap: '_xs' },
  checkItem: { display: 'inline-flex', alignItems: 'center', gap: '_xs', whiteSpace: 'nowrap' },
  section: { display: 'flex', flexDirection: 'column', gap: '_xs', minWidth: 0 },
});

/** 一项的完成情况 */
export interface ProgressItem {
  /** 名称 */
  label: string;
  /** 完成了没有 */
  done: boolean;
  /** 补充信息：日期、证据、超时 */
  extra?: VNodeChild;
}

/** 完成与否的图标 */
const stateIcon = (done: boolean) => (
  <Icon icon={done ? CircleCheck : CircleDashed} sx={done ? styles.done : styles.todo} />
);

/** 一排完成与否的圆点；完整说明给读屏与悬停提示 */
export const ProgressDots = _component(({ items }: { items: readonly ProgressItem[] }) => () => {
  const label = items.map((item) => `${item.label}${item.done ? '已完成' : '未完成'}`).join('，');
  return (
    <span {...stylex.attrs(styles.dots)} role="img" aria-label={label} title={label}>
      {items.map((item) => (
        <span key={item.label}>{stateIcon(item.done)}</span>
      ))}
    </span>
  );
});

/** 一排完成情况：图标、名称、补充信息 */
export const Checklist = _component(({ items }: { items: readonly ProgressItem[] }) => () => (
  <ul {...stylex.attrs(listStyles.reset, styles.checklist)}>
    {items.map((item) => (
      <li key={item.label} {...stylex.attrs(styles.checkItem)}>
        {stateIcon(item.done)}
        <Small tone={item.done ? undefined : 'muted'}>{item.label}</Small>
        {item.extra}
      </li>
    ))}
  </ul>
));

/** 带标题的一段：标题一行（进度写在标题里）加内容 */
export const DetailSection = _component(
  ({
    title,
    tone,
    children,
  }: {
    title: VNodeChild;
    /** 标题的色调：齐全时用 success；默认淡色 */
    tone?: 'success';
    children?: VNodeChild;
  }) =>
    () => (
      <section {...stylex.attrs(styles.section)}>
        <Small tone={tone ?? 'muted'}>{title}</Small>
        {children}
      </section>
    ),
);
