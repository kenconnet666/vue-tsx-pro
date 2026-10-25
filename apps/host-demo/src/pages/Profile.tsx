import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { storeToRefs } from 'pinia';
import { inject } from 'vue';
import { useRoute } from 'vue-router';
import { NameField } from '../components/NameField';
import { siteNameKey } from '../site';
import { useUserStore } from '../stores/user';

const styles = css.create({
  page: { display: 'grid', gap: '_sm', padding: '_lg' },
});

/** 用我们的写法写的页面：路由、store、inject 都来自宿主 */
export const Profile = _component(() => {
  const route = useRoute();
  const siteName = inject(siteNameKey, '');
  // storeToRefs 返回一组 Ref，_fromRef 之后像普通变量一样读写，写入直接落到 store
  let { name } = _fromRef(storeToRefs(useUserStore()));
  const userId = _derived(String(route.params.id));

  return () => (
    <section class="profile" {...css.attrs(styles.page)}>
      <h1>用户 {userId}</h1>
      <p class="site-name">{siteName}</p>
      <NameField _value={name} />
      <p class="greeting">你好，{name}</p>
      <button type="button" class="reset" onClick={() => (name = 'Ada')}>
        重置
      </button>
    </section>
  );
});
