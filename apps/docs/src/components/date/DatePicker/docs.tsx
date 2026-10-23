import { _component } from '@vue-tsx-pro/tsx';
import { Code, Kbd } from '@vue-tsx-pro/ui';
import api from 'virtual:api/DatePickerProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import { KeyboardReference } from '../../../site/KeyboardReference';
import { calendarKeys, pickerKeys, segmentKeys } from '../keyboard';
import Booking from './demo/Booking.tsx?demo';
import Granularity from './demo/Granularity.tsx?demo';
import Presets from './demo/Presets.tsx?demo';
import States from './demo/States.tsx?demo';
import Values from './demo/Values.tsx?demo';

export const meta = {
  title: 'DatePicker 日期选择器',
  description: '输入框加弹出的日历：可以直接键入，也可以点选；也用来选年份、月份，或日期加时间。',
  order: 5,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { DatePicker } from '@vue-tsx-pro/ui';">
    <Examples>
      <ExampleColumn>
        <Example id="booking" title="基础用法" demo={Booking}>
          输入框就是 DateField，分段键入；按钮或 <Kbd>Alt</Kbd> + <Kbd>↓</Kbd>{' '}
          弹出日历，焦点落在已选（或今天）那一格，点选后关闭、焦点回到按钮。<Code>min</Code>、
          <Code>max</Code>、<Code>isDateUnavailable</Code> 同时作用于输入框与日历。
        </Example>
        <Example id="presets" title="快捷选项与“今天”" demo={Presets}>
          <Code>presets</Code> 列在日历旁边：<Code>{'{ label, value }'}</Code>，value
          是函数时每次打开按当时算；超出范围的不可用，当前值对应的那一项按下。日历下方的“今天”（选月份时“本月”、选年份时“今年”）不在范围内时不可用，
          <Code>showToday={'{false}'}</Code> 去掉。
        </Example>
        <Example id="states" title="外观与状态" demo={States}>
          <Code>variant</Code>、<Code>size</Code>、<Code>radius</Code>、<Code>icon</Code>{' '}
          与其他输入框同一套。只读时能聚焦、能复制，不弹日历；Field 上的 <Code>disabled</Code>、
          <Code>readonly</Code>、<Code>required</Code> 与 <Code>error</Code> 会交给里面的选择器。
          <Code>placement</Code> 改弹出位置，<Code>visibleMonths</Code> 并排显示几个月。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="granularity" title="年份、季度、月份、周与时间" demo={Granularity}>
          <Code>granularity</Code> 是 <Code>year</Code>、<Code>month</Code>{' '}
          时弹出年份、月份的选择（即 YearPicker、MonthPicker）；<Code>quarter</Code>{' '}
          弹出季度面板（值 <Code>'2026-Q4'</Code>，QuarterCalendar 也可以单独用），<Code>week</Code>{' '}
          按 ISO 8601 的周选（值 <Code>'2026-W43'</Code>
          ，日历周一开始、行首是周数，点哪天都是它那一周）；到 <Code>minute</Code>{' '}
          时选完日期焦点落到“时”那一段接着输入（即 DateTimePicker），没有时间时先补 00:00。
        </Example>
        <Example id="values" title="值的类型与表单提交" demo={Values}>
          值默认是 ISO 字符串（与原生 input、URL 参数、zod 一致）；
          <Code>valueType="dateValue"</Code> 写回 @internationalized/date 的 CalendarDate，可以直接{' '}
          <Code>add</Code>、<Code>compare</Code>。传进来是哪种类型就写回哪种。<Code>name</Code>{' '}
          让原生表单提交 ISO 字符串。
        </Example>
      </ExampleColumn>
    </Examples>
    <KeyboardReference keys={[...segmentKeys, ...pickerKeys, ...calendarKeys]}>
      输入框是分段的 DateField；弹出的日历与 Calendar 相同，选中后关闭，焦点回到按钮。
    </KeyboardReference>
    <ApiReference api={api} />
  </DocPage>
));
