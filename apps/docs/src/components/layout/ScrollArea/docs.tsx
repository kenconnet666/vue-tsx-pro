import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import pageScrollbarApi from 'virtual:api/PageScrollbarProps';
import api from 'virtual:api/ScrollAreaProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { Examples } from '../../../site/Examples';
import Horizontal from './demo/Horizontal.tsx?demo';
import Inbox from './demo/Inbox.tsx?demo';
import Sheet from './demo/Sheet.tsx?demo';
import Types from './demo/Types.tsx?demo';

export const meta = {
  title: 'ScrollArea 滚动区域',
  description:
    '浮层滚动条：滚动仍是原生的，只把滚动条换成半透明、不占位的一层。纵向、横向、两个方向；整页用 PageScrollbar。',
  order: 2,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { PageScrollbar, ScrollArea } from '@vue-tsx-pro/ui';">
    <Examples>
      <Example id="vertical" title="纵向滚动" demo={Inbox}>
        高度（或最大高度）由 <Code>sx</Code> 给。视口可以用 Tab 聚焦、用方向键滚动，名称写在{' '}
        <Code>propsViewport</Code> 上；滚动条对读屏隐藏。
      </Example>
      <Example id="horizontal" title="横向滚动" demo={Horizontal}>
        <Code>axis="x"</Code>{' '}
        横向滚动，纵向超出的裁掉。滚动条浮在内容上，底部留出一点空，免得盖住卡片。
      </Example>
      <Example id="both" title="两个方向" demo={Sheet}>
        <Code>axis="both"</Code>：宽表格、电子表格。表头和行号用 position: sticky
        固定，在原生滚动里照常生效。
      </Example>
      <Example id="types" title="什么时候显示滚动条" demo={Types}>
        <Code>type</Code> 三种显示时机；淡出前的停留时间是 <Code>hideDelay</Code>。整页的滚动条用{' '}
        <Code>PageScrollbar</Code>：页面照常由窗口滚动，AppShell 默认带着它，本站就是。
      </Example>
    </Examples>
    <ApiReference api={[api, pageScrollbarApi]} />
  </DocPage>
));
