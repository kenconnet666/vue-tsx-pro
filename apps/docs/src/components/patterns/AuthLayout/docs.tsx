import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/AuthLayoutProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Login from './demo/Login.tsx?demo';

export const meta = {
  title: 'AuthLayout 认证页版式',
  description:
    '登录、注册、找回密码的整页版式：宽屏左边品牌区、右边表单，窄屏品牌区收成顶部一块，登录卡片不被挤到第二屏。',
  order: 11,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { AuthLayout } from '@zerodep-dev/vue-tsx-pro-ui/patterns';"
  >
    <Examples>
      <ExampleColumn>
        <Example id="login" title="登录页" demo={Login}>
          <Code>hero</Code> 是品牌区（标志、口号、背景动画），铺满它那一半；<Code>tools</Code>{' '}
          放在表单区的结束边上角（主题切换、语言切换）。分栏的断点与 AppShell{' '}
          一致（sizes.lg，64rem）；不写 <Code>hero</Code>{' '}
          时表单居中，不分栏。表单区宽屏时垂直居中，窄屏时贴近顶部。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
