import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/ItemListProps';
import itemApi from 'virtual:api/ItemListItemProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Notifications from './demo/Notifications.tsx?demo';
import Selectable from './demo/Selectable.tsx?demo';
import Todos from './demo/Todos.tsx?demo';

export const meta = {
  title: 'ItemList 条目列表',
  description:
    '界面里的列表：起始边是图标、色点或头像，中间是标题与说明，结束边是标记、数字或操作。待办、通知、收件箱、主从视图左边的列表；整条可以是链接或按钮。正文里的圆点、编号列表见 Text 页。',
  order: 13,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { ItemList, ItemListItem } from '@zerodep-dev/vue-tsx-pro-ui';"
  >
    <Examples>
      <ExampleColumn>
        <Example id="todos" title="待办" demo={Todos}>
          <Code>ItemListItem</Code> 的 <Code>start</Code>、<Code>title</Code>、
          <Code>description</Code>、<Code>end</Code> 四块排成一行；<Code>divided</Code>{' '}
          在条目之间画线，
          <Code>hoverable</Code> 悬停着底色，<Code>align="start"</Code> 让色点（StatusDot，见 Badge
          页）贴着标题那一行。
        </Example>
        <Example id="notifications" title="通知列表：整条是链接" demo={Notifications}>
          <Code>href</Code>{' '}
          {
            '时标题是链接（走路由适配），伸展盖住整条，点哪里都打开；悬停着底色，焦点环画在整条上。结束边的操作（标为已读）是独立的按钮，叠在上面照常可点。'
          }
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="selectable" title="可选中的行" demo={Selectable}>
          <Code>onSelect</Code> 时标题是按钮，整条可点；<Code>selected</Code>{' '}
          是正在看的一条（主从视图左边的列表、收件箱）：选中色的底色，按钮带 aria-current。
          <Code>disabled</Code> 的一条变淡、点不了。标题的按钮、链接经 <Code>propsButton</Code>、
          <Code>propsLink</Code> 改。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={[api, itemApi]} />
  </DocPage>
));
