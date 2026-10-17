import * as stylex from '@stylexjs/stylex';
import { storeToRefs } from 'pinia';
import { inject } from 'vue';
import { useRoute } from 'vue-router';
import { _component } from '@vue-tsx-pro/tsx';
import { NameField } from '../components/NameField';
import { useUserStore } from '../stores/user';
import { themeKey } from '../theme';

const styles = stylex.create({
  page: { display: 'grid', gap: 8, padding: 16 },
  dark: { color: '#f4f4f8', backgroundColor: '#1d1d22' },
});

/** 用我们的写法写的页面：路由、store、inject 都来自宿主 */
export const Profile = _component(() => {
  const route = useRoute();
  const theme = inject(themeKey, 'light');
  // storeToRefs 返回一组 Ref，_from 之后像普通变量一样读写，写入直接落到 store
  let { name } = _from(storeToRefs(useUserStore()));
  const userId = _derived(String(route.params.id));

  return () => (
    <section class="profile" {...stylex.attrs(styles.page, theme === 'dark' && styles.dark)}>
      <h1>用户 {userId}</h1>
      <NameField v-model:value={name} />
      <p class="greeting">你好，{name}</p>
      <button type="button" class="reset" onClick={() => (name = 'Ada')}>
        重置
      </button>
    </section>
  );
});
