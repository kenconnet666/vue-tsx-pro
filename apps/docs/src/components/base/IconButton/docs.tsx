import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import copyApi from 'virtual:api/CopyButtonProps';
import api from 'virtual:api/IconButtonProps';
import linkApi from 'virtual:api/IconLinkButtonProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Links from './demo/Links.tsx?demo';
import Presets from './demo/Presets.tsx?demo';
import States from './demo/States.tsx?demo';
import Toolbar from './demo/Toolbar.tsx?demo';

export const meta = {
  title: 'IconButton 图标按钮',
  description:
    '只有图标的按钮：工具栏、卡片上的操作；预设的 CloseButton、ClearButton、CopyButton 与链接 IconLinkButton。',
  order: 2,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { IconButton, CloseButton, ClearButton, CopyButton, IconLinkButton } from '@zerodep-dev/vue-tsx-pro-ui';"
  >
    <Examples>
      <ExampleColumn>
        <Example id="toolbar" title="基础用法" demo={Toolbar}>
          宽高相等，默认 ghost 样式、中性色（一排图标不会满屏品牌色）；外观选项同
          Button。没有文字，类型上必须给 <Code>aria-label</Code>
          ，读屏才知道它是做什么的。
        </Example>
        <Example id="states" title="加载、不可用与异步复制" demo={States}>
          <Code>loading</Code> 时图标换成转圈、点击无效；<Code>focusableWhenDisabled</Code>{' '}
          让不可用的按钮仍能聚焦，配 Tooltip 说明为什么不能点。<Code>CopyButton</Code> 的{' '}
          <Code>value</Code> 可以是返回 Promise 的函数（点击时才生成，等待时转圈），
          <Code>timeout</Code> 是对勾停留的毫秒数，<Code>onCopied</Code> 拿到是否成功。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="presets" title="预设按钮" demo={Presets}>
          <Code>CloseButton</Code>、<Code>ClearButton</Code> 带好了图标与读屏名称（取语言包）；
          <Code>CopyButton</Code> 复制成功时图标换成对勾、读屏播报“已复制”，几秒后复原。
        </Example>
        <Example id="links" title="图标链接" demo={Links}>
          点了去别处的图标用 <Code>IconLinkButton</Code>（a 元素）：站内链接经 router 跳转，
          <Code>external</Code> 在新窗口打开。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={[api, copyApi, linkApi]} />
  </DocPage>
));
