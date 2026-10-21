import { _component } from '@vue-tsx-pro/tsx';
import { Code, Kbd } from '@vue-tsx-pro/ui';
import api from 'virtual:api/RangeCalendarProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { ExampleColumn, Examples } from '../../../site/Examples';
import { Example } from '../../../site/Example';
import { KeyboardReference } from '../../../site/KeyboardReference';
import { calendarKeys } from '../keyboard';
import Display from './demo/Display.tsx?demo';
import Hotel from './demo/Hotel.tsx?demo';
import Leave from './demo/Leave.tsx?demo';
import Report from './demo/Report.tsx?demo';

export const meta = {
  title: 'RangeCalendar 区间日历',
  description: '直接摊开的区间日历：先点开始、再点结束，悬停时预览。入住与离店、报表的起止日期。',
  order: 2,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { RangeCalendar } from '@vue-tsx-pro/ui';">
    <Examples>
      <ExampleColumn>
        <Example id="hotel" title="入住与离店" demo={Hotel}>
          值是 <Code>{'{ start, end }'}</Code>（ISO
          日期，两端都含），反着点也会排好序。默认区间里不能夹着不可选的日子：点了入住之后，越过订满那晚的一侧都变成不可选，悬停预览也停在边界；选到一半按{' '}
          <Kbd>Esc</Kbd> 取消。
        </Example>
        <Example id="display" title="显示、只读与值的类型" demo={Display}>
          <Code>firstDayOfWeek</Code> 一周从哪天开始（不写时取语言包），
          <Code>showWeekNumbers</Code> 在行首显示周数，<Code>fixedWeeks={'{false}'}</Code>{' '}
          按实际行数显示；<Code>readonly</Code> 能翻页、移动焦点，不能改。一开始为空时
          <Code>valueType="dateValue"</Code> 写回 CalendarDate，<Code>defaultFocused</Code>{' '}
          决定先显示哪个月；<Code>onPick</Code> 每选完一个区间调用一次。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="leave" title="跨过不可选的日子" demo={Leave}>
          <Code>allowsUnavailableInRange</Code>{' '}
          允许区间跨过不可选的日子：周末不能作为请假的开始或结束，但可以被夹在中间。
        </Example>
        <Example id="presets" title="页脚的快捷区间" demo={Report}>
          <Code>footer</Code> 放在网格下面；<Code>presetIsoRange</Code>{' '}
          按今天与语言的一周第一天算出“最近 7
          天”“本月”。外面改了值、新区间不在这一页时，日历自动翻过去。要输入框加弹出日历与快捷选项用
          DateRangePicker。
        </Example>
      </ExampleColumn>
    </Examples>
    <KeyboardReference keys={calendarKeys}>
      先选开始、再选结束；选了开始以后移动焦点时，区间跟着预览。<Kbd>Esc</Kbd> 取消还没选完的区间。
    </KeyboardReference>
    <ApiReference api={api} />
  </DocPage>
));
