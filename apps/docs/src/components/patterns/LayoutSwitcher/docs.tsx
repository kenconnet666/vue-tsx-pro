import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code, Link } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/LayoutSwitcherProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import Basic from './demo/Basic.tsx?demo';

export const meta = {
  title: 'LayoutSwitcher 布局切换',
  description:
    '让用户自己选侧栏的形式（固定 / 抽屉）和抽屉从哪一边滑出（左、右、上、下）的按钮菜单，选择记在本地存储里。',
  order: 9.5,
};

export default _component(() => () => (
  <DocPage
    meta={meta}
    imports={
      "import { createLayoutPreference } from '@zerodep-dev/vue-tsx-pro-ui';\n" +
      "import { LayoutSwitcher } from '@zerodep-dev/vue-tsx-pro-ui/patterns';"
    }
  >
    <Example id="switcher" title="布局切换按钮" demo={Basic}>
      <Code>createLayoutPreference</Code> 记住侧栏的形式、抽屉的方向、开关与尺寸（默认存进
      localStorage，<Code>storageKey: false</Code>{' '}
      不存；其他标签页的改动也会跟着变），各项都是可读可写的属性。<Code>LayoutSwitcher</Code>{' '}
      是图标按钮加两组单选菜单：侧栏形式（固定或抽屉）与抽屉位置（左、右、上、下），选了“固定”时位置不可选，按钮的图标表示当前的位置。用法和{' '}
      <Link href="/components/theme-switcher">ThemeSwitcher</Link>{' '}
      对应：主题管颜色，布局管结构。把同一个 <Code>layout</Code> 交给 AppShell 的{' '}
      <Code>layout</Code> 才会生效，见 <Link href="/components/app-shell">AppShell</Link>{' '}
      的“用户自选布局”。
    </Example>
    <ApiReference api={[api]} />
  </DocPage>
));
