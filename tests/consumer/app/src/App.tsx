// 只用发布包能做的事：符文、组件、StyleX + 主题 tokens、Provider 暗色主题、Shiki 高亮（可选依赖的子路径）
import { Check } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { CodeBlock, darkTheme, Icon, Provider } from '@vue-tsx-pro/ui';

const styles = stylex.create({
  button: { padding: '_md', backgroundColor: '_accent', color: '_accentContrast' },
});

export const App = _component(() => {
  let count = _state(0);
  return () => (
    <main>
      <button type="button" class="count" {...stylex.attrs(styles.button)} onClick={() => count++}>
        <Icon icon={Check} aria-label="计数" />
        {count}
      </button>
      <Provider theme={darkTheme}>
        <p class="dark-text">暗色主题</p>
      </Provider>
      <CodeBlock class="code" lang="ts" code="const answer = 42;" />
    </main>
  );
});
