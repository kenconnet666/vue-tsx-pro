import { _component } from '@vue-tsx-pro/tsx';
import { Code, Link } from '@vue-tsx-pro/ui';
import api from 'virtual:api/CalendarBoardProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { KeyboardReference } from '../../../site/KeyboardReference';
import { calendarKeys } from '../keyboard';
import Roster from './demo/Roster.tsx?demo';
import Schedule from './demo/Schedule.tsx?demo';

export const meta = {
  title: 'CalendarBoard 整页月历',
  description:
    '一个月铺满一页，每天一个大格子，放日程、排班、节假日。在输入框里选日期用 DatePicker，小日历用 Calendar。',
  order: 3,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { CalendarBoard } from '@vue-tsx-pro/ui';">
    <Example id="schedule" title="日程" demo={Schedule}>
      <Code>events</Code> 按 <Code>getEventDate</Code> 放进格子，给了 <Code>getEventEnd</Code>{' '}
      的跨天的每一天都有（出差）；默认显示带色调（<Code>getEventTone</Code>
      ）的一行文字，<Code>renderEvent</Code> 自定义。每天最多 <Code>maxEvents</Code>{' '}
      条，其余收成“还有 N 项”，点了选中那一天，由页面在旁边列出全部。<Code>value</Code>{' '}
      是选中的那一天，<Code>month</Code> 是显示的月份（都可以双向绑定），<Code>toolbar</Code>{' '}
      放在页头（筛选、视图切换）。
    </Example>
    <Example id="roster" title="排班与节假日" demo={Roster}>
      <Code>renderDay</Code>{' '}
      往格子里加别的内容（这里是三个班的值班人），拿到这一天是不是周末、补齐的上下月；
      <Code>getDayNote</Code> 是日期旁边的小字（节假日、调休的“休”“班”）。周末的格子默认是浅色底。
      <Code>readonly</Code> 时只能翻页、移动焦点，不能选。
    </Example>
    <KeyboardReference keys={calendarKeys}>
      键盘与 <Link href="/components/calendar">Calendar</Link>{' '}
      一致：每天的日期数字是一个按钮，焦点在当前日期上，读屏念完整日期与有几项日程；格子里的日程可以是链接、按钮，Tab
      照常进去。
    </KeyboardReference>
    <ApiReference api={api} />
  </DocPage>
));
