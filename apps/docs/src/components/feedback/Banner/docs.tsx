import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/BannerProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import Page from './demo/Page.tsx?demo';

export const meta = {
  title: 'Banner 横幅',
  description:
    '贴着页面顶部的一行通栏通知：系统维护、试用到期、只读模式这类整页都相关的消息，可以关闭。',
  order: 1,
};

export default _component(() => () => (
  <DocPage meta={meta} imports="import { Banner } from '@zerodep-dev/vue-tsx-pro-ui';">
    <Example id="page" title="页面顶部" demo={Page}>
      横幅占满宽度、内容居中，<Code>title</Code> 是加粗的开头，<Code>action</Code>{' '}
      跟在正文后面（链接或小按钮）。<Code>variant="solid"</Code>{' '}
      最醒目，用于必须先看到的消息；默认浅色底。写了 <Code>onClose</Code>{' '}
      才有关闭按钮：先淡出再报告，使用方移除并记住“已关闭”，没移除就重新出现；关闭后焦点交给相邻的可聚焦元素。页面加载时就在的横幅不播报，运行中才出现的写{' '}
      <Code>live</Code>
      （同 Alert）。放在内容里、说明某一块状态、要写几行的用 Alert。
    </Example>
    <ApiReference api={api} />
  </DocPage>
));
