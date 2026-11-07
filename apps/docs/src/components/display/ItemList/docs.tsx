import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/ItemListProps';
import itemApi from 'virtual:api/ItemListItemProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import Todos from './demo/Todos.tsx?demo';

export const meta = {
  title: 'ItemList 条目列表',
  description:
    '界面里的列表：起始边是图标、色点或头像，中间是标题与说明，结束边是标记、数字或操作。待办、通知、我负责的任务。正文里的圆点、编号列表见 Text 页。',
  order: 13,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { ItemList, ItemListItem } from '@zerodep-dev/vue-tsx-pro-ui';"
  >
    <Example id="todos" title="待办" demo={Todos}>
      <Code>ItemListItem</Code> 的 <Code>start</Code>、<Code>title</Code>、<Code>description</Code>
      、<Code>end</Code> 四块排成一行；<Code>divided</Code> 在条目之间画线，
      <Code>hoverable</Code> 悬停着底色，<Code>align="start"</Code> 让色点（StatusDot，见 Badge
      页）贴着标题那一行。
    </Example>
    <ApiReference api={[api, itemApi]} />
  </DocPage>
));
