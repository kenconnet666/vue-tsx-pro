import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/NotificationCenterProps';
import itemApi from 'virtual:api/NotificationItem';
import listApi from 'virtual:api/NotificationListProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Inbox from './demo/Inbox.tsx?demo';
import TopBar from './demo/TopBar.tsx?demo';
import Widget from './demo/Widget.tsx?demo';

export const meta = {
  title: 'NotificationCenter 通知中心',
  description:
    '顶栏的铃铛与通知列表：未读数、按类型筛选、只看未读、标为已读、点了去对应的页面；列表也能直接放在通知页面、抽屉里。和 Toast 不同，通知留着、可以回头看。',
  order: 6,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { NotificationCenter, NotificationList } from '@zerodep-dev/vue-tsx-pro-ui/patterns';"
  >
    <Examples>
      <ExampleColumn wide>
        <Example id="top-bar" title="顶栏的铃铛" demo={TopBar}>
          <Code>items</Code>{' '}
          是通知（新的在前，组件不排序）：标题、补充说明、时间、类型、读没读、地址与色调。点一条报告{' '}
          <Code>onRead</Code> 并收起，有 <Code>href</Code>{' '}
          时走路由适配去那里；“全部标为已读”报告全部未读的。通知存在哪、怎么算已读由应用决定（接口、推送），组件只管显示与报告。铃铛的名称带未读数；
          <Code>footer</Code> 放“打开收件箱”这类入口。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="inbox" title="通知页面" demo={Inbox}>
          同一份列表 <Code>NotificationList</Code> 直接放进卡片、抽屉，不进弹出层。写了{' '}
          <Code>types</Code> 时有按类型筛选的按钮，“只看未读”在后面；<Code>{'title={false}'}</Code>{' '}
          去掉标题行，“全部标为已读”挪到筛选那一行。未读的前面一个色点（<Code>tone</Code>
          ：超时、被退回用
          danger、warning），读屏念“未读”；时间写成相对现在、在行末，悬停看完整时间，
          <Code>now</Code> 固定“现在”（演示数据、截图）。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="widget" title="工作台的小卡片" demo={Widget}>
          要显示哪些由应用筛好再交给 <Code>items</Code>（这里只有要我处理的提醒）；
          <Code>title</Code> 换成卡片的标题，没写 <Code>types</Code> 就没有类型筛选，
          <Code>empty</Code> 是全部处理完后的说明，<Code>footer</Code> 链到收件箱。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={[api, listApi, itemApi]} />
  </DocPage>
));
