import { _component } from '@vue-tsx-pro/tsx';
import { Code, Kbd } from '@vue-tsx-pro/ui';
import api from 'virtual:api/DateRangePickerProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import { KeyboardReference } from '../../../site/KeyboardReference';
import { calendarKeys, pickerKeys, segmentKeys } from '../keyboard';
import Report from './demo/Report.tsx?demo';
import States from './demo/States.tsx?demo';

export const meta = {
  title: 'DateRangePicker 区间选择器',
  description:
    '一个输入框里填开始与结束，按钮弹出区间日历与快捷区间：报表的统计区间、酒店的入住与离店。',
  order: 6,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { DateRangePicker } from '@vue-tsx-pro/ui';">
    <Examples>
      <ExampleColumn>
        <Example id="report" title="基础用法" demo={Report}>
          两组分段共用一个外壳，读屏先念字段名，再念“开始日期”或“结束日期”；开始那组刚填全时焦点自动进结束那组，两端都填好才写回{' '}
          <Code>{'{ start, end }'}</Code>
          。按钮或 <Kbd>Alt</Kbd> + <Kbd>↓</Kbd> 弹出区间日历（默认并排两个月），
          <Code>presets</Code>{' '}
          列在日历旁边（按今天与语言的一周第一天算，文字取语言包）。结束早于开始、超出范围时外壳显示出错；
          <Code>startName</Code>、<Code>endName</Code> 随表单提交两端的 ISO 日期。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="states" title="跨过不可选的日期与状态" demo={States}>
          默认区间里不能夹着不可选的日期；<Code>allowsUnavailableInRange</Code>{' '}
          允许跨过它们（请假只能从工作日起止，但可以跨周末）。<Code>visibleMonths</Code>{' '}
          改并排的月数，窄的地方用 1。<Code>valueType="dateValue"</Code> 让一开始为空的值也写回
          CalendarDate，起止能直接 compare 算天数。图标、外观、必填、只读、不可用同其他输入框。
        </Example>
      </ExampleColumn>
    </Examples>
    <KeyboardReference keys={[...segmentKeys, ...pickerKeys, ...calendarKeys]}>
      开始那组刚填全时焦点自动进结束那组；弹出的区间日历里先选开始、再选结束，选好后关闭。
    </KeyboardReference>
    <ApiReference api={api} />
  </DocPage>
));
