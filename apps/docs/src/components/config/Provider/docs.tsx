import { _component } from '@vue-tsx-pro/tsx';
import { Code, CodeBlock } from '@vue-tsx-pro/ui';
import scopeApi from 'virtual:api/ConfigScopeProps';
import api from 'virtual:api/ProviderProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { Examples } from '../../../site/Examples';
import Locales from './demo/Locales.tsx?demo';
import Rtl from './demo/Rtl.tsx?demo';
import Scoped from './demo/Scoped.tsx?demo';

export const meta = {
  title: 'Provider 配置',
  description:
    '主题、语言包、组件默认值、路由适配：应用级用 createUi 一次装好，局部用 Provider 覆盖；useFormat 按当前语言格式化数字、金额与日期。',
  order: 1,
};

const setup = `import { createUi, zhCN } from '@vue-tsx-pro/ui';
import { vueRouterAdapter } from '@vue-tsx-pro/ui/vue-router';

app.use(
  createUi({
    theme: () => preference.theme,          // ref 或 getter：运行时切换主题
    lang: zhCN,
    defaults: { Button: { radius: 'full' } }, // 统一改组件的默认外观
    router: vueRouterAdapter(router),        // 站内链接不刷新页面
  }),
);`;

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { ConfigScope, createUi, Provider, useFormat } from '@vue-tsx-pro/ui';"
  >
    <CodeBlock code={setup} lang="ts" title="main.ts" />
    <Example id="scoped" title="局部主题与默认值" demo={Scoped}>
      <Code>Provider</Code> 只覆盖写了的配置，其余沿用上一层。默认值的优先级：组件上显式写的 prop
      &gt; 最近一层 Provider &gt; createUi &gt;
      组件自己的默认值；只收外观类的选项（样式、尺寸、色调）。
    </Example>
    <Examples>
      <Example id="locales" title="语言包与 useFormat" demo={Locales}>
        语言包里是组件的全部文字与格式习惯（币种、一周从哪天开始、时区）；
        <Code>defineLang(zhCN, {'{…}'})</Code> 改其中几项。<Code>useFormat()</Code>{' '}
        按当前语言格式化，字符串与 Decimal 按十进制原样格式化，金额不丢精度。
      </Example>
      <Example id="rtl" title="从右到左" demo={Rtl}>
        语言包的 <Code>direction</Code> 是 rtl 时，Provider 写上
        dir="rtl"：组件都用逻辑属性，布局、箭头与方向键自动镜像。传送到 body
        的内容（Toaster、浮层）用 <Code>ConfigScope</Code> 重新带上主题、语言与方向。
      </Example>
    </Examples>
    <ApiReference api={[api, scopeApi]} />
  </DocPage>
));
