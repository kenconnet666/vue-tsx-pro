import { _component } from '@vue-tsx-pro/tsx';
import { Code, Link } from '@vue-tsx-pro/ui';
import customizerApi from 'virtual:api/ThemeCustomizerProps';
import api from 'virtual:api/ThemeSwitcherProps';
import thumbnailApi from 'virtual:api/ThemeThumbnailProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Customizer from './demo/Customizer.tsx?demo';
import Gallery from './demo/Gallery.tsx?demo';
import Scoped from './demo/Scoped.tsx?demo';

export const meta = {
  title: 'ThemeSwitcher 主题切换',
  description:
    '切换主题的按钮菜单（跟随系统与各套主题，圆形展开）、主题缩略图，以及调品牌色、圆角、字体的主题编辑器。',
  order: 9,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports={
      "import { ThemeSwitcher } from '@vue-tsx-pro/ui/patterns';\n" +
      "import { ThemeCustomizer, ThemeThumbnail } from '@vue-tsx-pro/ui/theme-customize';"
    }
  >
    <Examples>
      <ExampleColumn>
        <Example id="switcher" title="主题切换按钮" demo={Scoped}>
          <Code>createThemePreference</Code> 记住选择（默认存进 localStorage，
          <Code>storageKey: false</Code> 不存）并跟随系统；<Code>ThemeSwitcher</Code>{' '}
          列出“跟随系统”与各套主题，选中后新主题从按钮处圆形展开。
          <Code>preference.theme</Code> 交给 createUi 或 Provider——这里只交给下面这块区域。
        </Example>
        <Example id="thumbnail" title="主题缩略图" demo={Gallery}>
          <Code>ThemeThumbnail</Code>{' '}
          用主题自己的底色、表面、主色画一张小卡片，适合做选主题的网格；它是装饰（aria-hidden），名称写在旁边的文字里。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="customizer" title="主题编辑器" demo={Customizer}>
          <Code>ThemeCustomizer</Code>{' '}
          调品牌色、中性色、圆角、缩放、字体与动效，实时检查对比度，可以导出代码；设置交给{' '}
          <Code>customizeTheme</Code>（<Code>@vue-tsx-pro/ui/theme-customize</Code>
          ）生成新主题。完整的用法见<Link href="/guide/theming">主题定制</Link>。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={[api, thumbnailApi, customizerApi]} />
  </DocPage>
));
