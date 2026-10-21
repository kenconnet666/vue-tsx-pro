import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/VirtualListProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Contacts from './demo/Contacts.tsx?demo';
import Feed from './demo/Feed.tsx?demo';
import Horizontal from './demo/Horizontal.tsx?demo';

export const meta = {
  title: 'VirtualList 虚拟列表',
  description:
    '只渲染看得见的项，上万条数据照样流畅：行高可以各不相同，接近末尾时加载下一页，加载中与空数据都有内置状态。',
  order: 8,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { VirtualList } from '@vue-tsx-pro/ui';">
    <Examples>
      <ExampleColumn>
        <Example id="contacts" title="一万条联系人" demo={Contacts}>
          组件自己是滚动容器，高度用 <Code>sx</Code> 给；<Code>estimateSize</Code>{' '}
          是估计的行高，渲染后按实际高度测量。数据会过滤、重排时给 <Code>getKey</Code>
          。没有数据时显示 <Code>empty</Code>；读屏念“第几项，共几项”，没渲染的也算在总数里。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="feed" title="滚动加载" demo={Feed}>
          <Code>onRangeChange</Code> 报告可见范围，接近末尾时取下一页。<Code>loading</Code>{' '}
          时没有数据显示骨架行，已有数据则在顶部显示进度条。
        </Example>
        <Example id="horizontal" title="横向与跳到指定项" demo={Horizontal}>
          <Code>horizontal</Code> 横向排列与滚动（给宽度），<Code>estimateSize</Code> 是估计的宽度；
          <Code>overscan</Code> 是可见范围前后多渲染几项。<Code>handle</Code> 拿到{' '}
          <Code>scrollToIndex</Code> / <Code>scrollToOffset</Code>，<Code>align</Code>{' '}
          控制停在开头、中间还是末尾。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
