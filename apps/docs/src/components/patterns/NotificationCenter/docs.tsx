import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/NotificationCenterProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Basic from './demo/Basic.tsx?demo';

export const meta = {
  title: 'NotificationCenter 通知中心',
  description:
    '顶栏的铃铛：未读数、通知列表（按类型筛选、只看未读）、标为已读、点了去对应的页面。和 Toast 不同，通知留着、可以回头看。',
  order: 6,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { NotificationCenter } from '@vue-tsx-pro/ui/patterns';"
  >
    <Examples>
      <ExampleColumn>
        <Example id="basic" title="基础用法" demo={Basic}>
          <Code>items</Code>{' '}
          是通知（新的在前，组件不排序）：标题、补充说明、时间、类型、读没读、地址与色调。点一条报告{' '}
          <Code>onRead</Code>，有 <Code>href</Code>{' '}
          时走路由适配去那里；“全部标为已读”报告全部未读的。通知存在哪、怎么算已读由应用决定（接口、推送），组件只管显示与报告。时间写成相对现在，悬停看完整时间；
          <Code>now</Code> 固定“现在”（演示数据、截图）。写了 <Code>types</Code>{' '}
          时有按类型筛选的按钮（多了换行），“只看未读”在最后；未读的前面一个色点（<Code>tone</Code>
          ，超时、被退回用 danger、warning），读屏念“未读”，铃铛的名称带未读数。
          <Code>footer</Code> 放“打开收件箱”这类入口。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
