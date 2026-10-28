/** 根组件：顶栏的站内导航 + 当前页面 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { Container, createFlex, Link, Strong } from '@zerodep-dev/vue-tsx-pro-ui';
import { RouterView } from 'vue-router';
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
});

export const App = _component(() => () => (
  <>
    <header {...css.attrs(styles.header)}>
      <Container size="lg">
        <Nav align="center" gap="lg" aria-label="站内导航">
          <Strong>fullstack-demo</Strong>
          {pages.map((page) => (
            <Link key={page.path} href={page.path} data-mode={page.mode}>
              {page.title}
            </Link>
          ))}
        </Nav>
      </Container>
    </header>
    <main {...css.attrs(styles.main)}>
      <Container size="lg">
        <RouterView />
      </Container>
    </main>
  </>
));
