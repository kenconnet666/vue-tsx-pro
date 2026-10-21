import { _component } from '@vue-tsx-pro/tsx';
import { Code, Kbd } from '@vue-tsx-pro/ui';
import api from 'virtual:api/DatePickerProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Booking from './demo/Booking.tsx?demo';
import Granularity from './demo/Granularity.tsx?demo';

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
      </ExampleColumn>
      <ExampleColumn>
        <Example id="granularity" title="年份、月份与时间" demo={Granularity}>
          <Code>granularity</Code> 是 <Code>year</Code>、<Code>month</Code>{' '}
          时弹出年份、月份的选择（即 YearPicker、MonthPicker）；到 <Code>minute</Code>{' '}
          时选完日期焦点落到“时”那一段接着输入（即 DateTimePicker），没有时间时先补 00:00。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
