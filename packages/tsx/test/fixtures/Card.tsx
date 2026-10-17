import * as stylex from '@stylexjs/stylex';
import type { NodeChild } from 'vue-jsx';
import { _component } from '../../src';

const styles = stylex.create({
  card: {
    display: 'grid',
    gap: 8,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#ddd',
  },
  // 动态值：编译成 CSS 变量 + 行内 style，相当于旧方案里的 bx()
  width: (px: number) => ({ width: px }),
});

/** 供探针统计 setup 执行次数 */
export let cardSetupCount = 0;

interface CardProps {
  title?: string;
  width?: number;
  /** 具名内容直接作为 JSX prop 传入，取代具名插槽 */
  header?: NodeChild;
  children?: NodeChild;
}

export const Card = _component(({ title = '', width, header, children }: CardProps) => {
  cardSetupCount++;

  return () => (
    <section {...stylex.attrs(styles.card, width != null && styles.width(width))}>
      <h2>{header ?? title}</h2>
      <div class="body">{children}</div>
    </section>
  );
});
