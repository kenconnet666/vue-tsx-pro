import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/DeadlineBadgeProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Calendar from './demo/Calendar.tsx?demo';
import States from './demo/States.tsx?demo';
import Todos from './demo/Todos.tsx?demo';

export const meta = {
  title: 'DeadlineBadge 时限标记',
  description:
    '按工作日算还剩几天、今天到期、超时几天，颜色随状态：收件箱、待办、各种有时限的列表。',
  order: 8,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { DeadlineBadge } from '@zerodep-dev/vue-tsx-pro-ui/patterns';"
  >
    <Examples>
      <ExampleColumn>
        <Example id="states" title="状态" demo={States}>
          <Code>due</Code> 是截止日。还早是中性色；剩下的工作日不多于 <Code>soon</Code>
          （默认 2）和今天到期是警示色；超时是危险色。写了 <Code>done</Code>{' '}
          按完成那天算，显示按时或超时完成。悬停看截止日，读屏也会念。演示固定了 <Code>today</Code>
          ，业务以服务器日期为准时也这样传。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="todos" title="待办列表" demo={Todos}>
          最常见的用法：列表每条的结束边（ItemList 的 <Code>end</Code>
          ）放一个时限标记，超时、快到期的一眼看出来；已完成的写 <Code>done</Code>
          ，显示按时还是超时完成。
        </Example>
      </ExampleColumn>
      <ExampleColumn wide>
        <Example id="calendar" title="开始日加工作日、节假日" demo={Calendar}>
          <Code>start</Code> + <Code>workdays</Code> 算截止日。工作日按 createUi / Provider 的{' '}
          <Code>workCalendar</Code>（<Code>createWorkCalendar</Code>{' '}
          带上法定节假日与调休补班），没给时只按周末；算法见 <Code>deadlineOf</Code>。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
