// 只用发布包能做的事：符文、组件、StyleX + 主题 tokens、Provider 暗色主题
import { Check } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { darkTheme, Icon, Provider } from '@vue-tsx-pro/ui';
import { colors, space } from '@vue-tsx-pro/ui/tokens.stylex';

const styles = stylex.create({
  button: { padding: space.md, backgroundColor: colors.accent, color: colors.accentContrast },
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
    </main>
  );
});
