import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/CalendarProps';
import calendarViewApi from 'virtual:api/CalendarViewProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { ExampleColumn, Examples } from '../../../site/Examples';
import { Example } from '../../../site/Example';
import { KeyboardReference } from '../../../site/KeyboardReference';
import { calendarKeys } from '../keyboard';
import Basic from './demo/Basic.tsx?demo';
import Locales from './demo/Locales.tsx?demo';
import Multiple from './demo/Multiple.tsx?demo';
import MultipleMonths from './demo/MultipleMonths.tsx?demo';
import Prices from './demo/Prices.tsx?demo';
import Sizes from './demo/Sizes.tsx?demo';
import Unavailable from './demo/Unavailable.tsx?demo';
import Views from './demo/Views.tsx?demo';
import Footer from './demo/Footer.tsx?demo';

export const meta = {
  title: 'Calendar 日历',
  description:
    '直接摊开的日历：选一天或多天，可以并排几个月、标出不可选的日子、在格子里放价格。要输入框加弹出日历用 DatePicker。',
  order: 1,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { Calendar } from '@zerodep-dev/vue-tsx-pro-ui';">
    <Examples>
      <ExampleColumn>
        <Example id="basic" title="基础用法" demo={Basic}>
          值是 ISO 日期字符串（<Code>'2026-10-20'</Code>），和原生日期输入框、URL 参数、zod 的{' '}
          <Code>z.iso.date()</Code> 一致；<Code>todayIso</Code>、<Code>shiftIsoDate</Code>、
          <Code>daysBetween</Code> 直接在这种字符串上算，<Code>useFormat().date</Code>{' '}
          也直接收它。用 @internationalized/date 的话，<Code>_value</Code>、<Code>min</Code>、
          <Code>max</Code> 也可以传
          CalendarDate、CalendarDateTime、ZonedDateTime，写回时保持同一种类型（时间、时区不丢），一开始为空时用{' '}
          <Code>valueType="dateValue"</Code> 指定。<Code>min</Code>{' '}
          之前的日子不能选，翻页按钮到头不可用。
        </Example>
        <Example id="unavailable" title="不可选的日期" demo={Unavailable}>
          <Code>isDateUnavailable</Code>{' '}
          标出约满、放假的日子：画删除线、不能选，但方向键仍能经过，读屏会念出来；判断星期几用{' '}
          <Code>isoDayOfWeek</Code>（按日期算，不受时区影响）。<Code>min</Code>、<Code>max</Code>{' '}
          之外的日期变淡，焦点也进不去。
        </Example>
        <Example id="prices" title="自定义格子" demo={Prices}>
          子节点是渲染函数，拿到日期与这一格的状态（选中、今天、不可选、在不在本月）：价格日历、标记点、农历都在这里放。读屏先念完整日期，再念格子里的文字（房价也能听到）；重复的日期数字加{' '}
          <Code>aria-hidden</Code> 不再念一遍。
        </Example>
        <Example id="multiple" title="多选" demo={Multiple}>
          <Code>selectionMode="multiple"</Code> 时值是数组，每天独立切换；
          <Code>showWeekNumbers</Code> 在每行前显示一年里的第几周（周一开始按 ISO 8601，周日开始按含
          1 月 1 日的那周）。
        </Example>
        <Example id="months" title="并排几个月" demo={MultipleMonths}>
          <Code>visibleMonths</Code>{' '}
          并排显示，放不下时自动换行；翻页按钮在两端，一次翻同样的月数，键盘移出当前页时也会翻页。
        </Example>
        <Example id="views" title="月份与年份视图" demo={Views}>
          点标题切到月份、再到年份视图，选好后逐级回到日期，焦点保留原来的那一天；
          <Code>granularity</Code> 为 <Code>month</Code> / <Code>year</Code>{' '}
          时选择就停在那一级，值是那个月 / 那年的第一天。 MonthPicker、YearPicker 就是这样做的。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="locales" title="跟随语言" demo={Locales}>
          月份名、星期名、读屏念的“2026年10月20日星期二”都由 Intl
          按当前语言生成，组件里没有写死的文字；一周从哪天开始按地区惯例（中国周一、美国周日），语言配置的{' '}
          <Code>firstDayOfWeek</Code> 或组件上的同名属性可以覆盖。
        </Example>
        <Example id="sizes" title="尺寸与状态" demo={Sizes}>
          <Code>size</Code> 对应主题的字号档位，格子、按钮按比例缩放，点击区域不小于 24px。
        </Example>
        <Example id="footer" title="页脚、固定六行与 onPick" demo={Footer}>
          <Code>footer</Code> 放在网格下面（快捷操作、图例）；<Code>fixedWeeks</Code>{' '}
          让每个月都显示六行，翻页时高度不跳；<Code>defaultFocused</Code> 是没有选择时先显示哪个月；
          <Code>onPick</Code> 在每次点选时调用，再点已选的那天也会——日期选择器据此关闭弹层。
        </Example>
      </ExampleColumn>
    </Examples>
    <KeyboardReference keys={calendarKeys}>
      整个月是一个网格（role="grid"），只有聚焦的那一格在 Tab 顺序里；移出当前显示的月份时自动翻页。
    </KeyboardReference>
    <ApiReference api={[api, calendarViewApi]} />
  </DocPage>
));
