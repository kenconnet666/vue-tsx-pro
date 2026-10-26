import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/ItemListProps';
import itemApi from 'virtual:api/ItemListItemProps';
import dotApi from 'virtual:api/StatusDotProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Dots from './demo/Dots.tsx?demo';
import Todos from './demo/Todos.tsx?demo';

export const meta = {
  title: 'ItemList 条目列表',
  description:
    '界面里的列表：起始边是图标、色点或头像，中间是标题与说明，结束边是标记、数字或操作。待办、通知、我负责的任务。StatusDot 是其中常用的状态色点。',
  order: 13,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { ItemList, ItemListItem, StatusDot } from '@zerodep-dev/vue-tsx-pro-ui';"
  >
    <Examples>
      <ExampleColumn>
        <Example id="todos" title="待办" demo={Todos}>
          <Code>ItemListItem</Code> 的 <Code>start</Code>、<Code>title</Code>、
          <Code>description</Code>、<Code>end</Code> 四块排成一行；<Code>divided</Code>{' '}
          在条目之间画线，
          <Code>hoverable</Code> 悬停着底色，<Code>align="start"</Code>{' '}
          让色点贴着标题那一行。正文里的列表（圆点、编号）用 List。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="dots" title="状态色点" demo={Dots}>
          <Code>StatusDot</Code> 比 Badge 轻，标出未读、新到、退回、图例。色调与 Badge 同名，
          <Code>color</Code> 给任意颜色；点本身就是信息时写 <Code>label</Code>，否则对读屏隐藏。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={[api, itemApi, dotApi]} />
  </DocPage>
));
