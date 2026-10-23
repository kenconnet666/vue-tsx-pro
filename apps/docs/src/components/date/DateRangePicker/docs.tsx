import { _component } from '@vue-tsx-pro/tsx';
import { Code, Kbd } from '@vue-tsx-pro/ui';
import api from 'virtual:api/DateRangePickerProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import { KeyboardReference } from '../../../site/KeyboardReference';
import { calendarKeys, pickerKeys, segmentKeys } from '../keyboard';
import Periods from './demo/Periods.tsx?demo';
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
          列在日历旁边：内置的名字按今天与语言的一周第一天算、文字取语言包，也可以写自己的{' '}
          <Code>{'{ label, value }'}</Code>（value 是函数时每次打开按当时算），都夹到 min–max
          之内。结束早于开始、超出范围时外壳显示出错；
          <Code>startName</Code>、<Code>endName</Code> 随表单提交两端的 ISO 日期。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="periods" title="按月、按年与日期时间" demo={Periods}>
          <Code>granularity</Code> 同 DateField：<Code>month</Code>、<Code>year</Code> 时两端是{' '}
          <Code>'2026-01'</Code>、<Code>'2026'</Code>，日历按月、按年选整段；快捷区间截成月、年。到{' '}
          <Code>minute</Code> 时是日期时间区间：日历里选日期，开始补 00:00、结束补
          23:59（已经填了的时间不变），选好后焦点去开始的“时”接着输入。
        </Example>
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
