import * as stylex from '@stylexjs/stylex';
import { _component } from '@vue-tsx-pro/tsx';

const styles = stylex.create({
  box: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 12,
    paddingBlock: 8,
    paddingInline: 12,
    borderRadius: 8,
    backgroundColor: '#f4f4f8',
  },
});

/** 冒烟演示：符文 + StyleX + 组件边界在文档站中可用 */
export const Hello = _component(() => {
  let count = _state(0);
  const label = _derived(count === 0 ? '还没点过' : `点了 ${count} 次`);

  return () => (
    <div {...stylex.attrs(styles.box)}>
      <button type="button" onClick={() => count++}>
        点我
      </button>
      <span class="hello-label">{label}</span>
    </div>
  );
});
