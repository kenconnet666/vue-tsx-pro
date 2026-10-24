// 只用发布包能做的事：符文、组件、运行时样式 + 主题 tokens、Provider 暗色主题、Shiki 高亮与主题定制（子路径）
import { Check } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { CodeBlock, darkTheme, Icon, lightTheme, Provider } from '@vue-tsx-pro/ui';
import { customizeTheme } from '@vue-tsx-pro/ui/theme-customize';

const styles = css.create({
  button: { padding: '_md', backgroundColor: '_accent', color: '_accentContrast' },
  accent: { color: '_accent' },
});

const grassTheme = customizeTheme(lightTheme, { accent: 'grass' });

export const App = _component(() => {
  let count = _state(0);
  return () => (
    <main>
      <button type="button" class="count" {...css.attrs(styles.button)} onClick={() => count++}>
        <Icon icon={Check} aria-label="计数" />
        {count}
      </button>
      <Provider theme={darkTheme}>
        <p class="dark-text">暗色主题</p>
      </Provider>
      <Provider theme={grassTheme}>
        <p class="grass-text" {...css.attrs(styles.accent)}>
          定制的品牌色
        </p>
      </Provider>
      <CodeBlock class="code" lang="ts" code="const answer = 42;" />
    </main>
  );
});
