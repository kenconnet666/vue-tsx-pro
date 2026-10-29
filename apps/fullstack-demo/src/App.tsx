/** 根组件：顶栏（按权限生成的菜单、切换示例用户）+ 当前页面 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { Alert, Container, createFlex, Link, Small, Strong } from '@zerodep-dev/vue-tsx-pro-ui';
import { useRoute } from 'vue-router';
import { type PageDef, PageView, useSession } from '@zerodep-dev/vue-tsx-pro-kit';
import { pages } from './pages.ts';

const Nav = createFlex('nav', 'Nav');

const styles = css.create({
  header: {
    borderBlockEndWidth: '_xs',
    borderBlockEndStyle: 'solid',
    borderBlockEndColor: '_border',
    paddingBlock: '_md',
  },
  main: { paddingBlock: '_xl' },
  users: { marginInlineStart: 'auto' },
});

/** 示例的用户（“登录”是整页跳转：服务端写 cookie 再回来） */
const DEMO_USERS = ['alice', 'bob', 'carol'];

export const App = _component(() => {
  const session = useSession();
  const route = useRoute();
  const signIn = (user: string) =>
    `/api/sign-in?user=${user}&back=${encodeURIComponent(route.fullPath)}`;

  return () => (
    <>
      <header {...css.attrs(styles.header)}>
        <Container size="lg">
          <Nav align="center" gap="lg" wrap aria-label="站内导航">
            <Strong>fullstack-demo</Strong>
            {pages
              .filter((page: PageDef) => session.can(page.permission))
              .map((page) => (
                <Link key={page.path} href={page.path} data-mode={page.mode}>
                  {page.title}
                </Link>
              ))}
            <Small sx={styles.users} data-testid="user">
              {session.user ? `当前：${session.user}` : '没登录'} ·{' '}
              {DEMO_USERS.filter((user) => user !== session.user).map((user) => (
                <a key={user} href={signIn(user)}>
                  切到 {user}{' '}
                </a>
              ))}
              {session.user && <a href={signIn('')}>退出</a>}
            </Small>
          </Nav>
        </Container>
      </header>
      <main {...css.attrs(styles.main)}>
        <Container size="lg">
          <PageView
            forbidden={() => <Alert tone="warning">没有权限打开这一页，换一个用户试试。</Alert>}
          />
        </Container>
      </main>
    </>
  );
});
