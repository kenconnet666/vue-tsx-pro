import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import countdownApi from 'virtual:api/CountdownProps';
import api from 'virtual:api/DateTimeProps';
import relativeApi from 'virtual:api/RelativeTimeProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Activity from './demo/Activity.tsx?demo';
import Countdowns from './demo/Countdowns.tsx?demo';
import Formats from './demo/Formats.tsx?demo';

export const meta = {
  title: 'DateTime 时间显示',
  description:
    'DateTime 按语言写日期时间，RelativeTime 写“3 分钟前”并自动更新，Countdown 倒数到某个时刻；都输出语义化的元素。',
  order: 8,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { Countdown, DateTime, RelativeTime } from '@vue-tsx-pro/ui';"
  >
    <Examples>
      <ExampleColumn>
        <Example id="activity" title="相对时间" demo={Activity}>
          <Code>RelativeTime</Code> 按相差多久自动取单位，措辞是“昨天”而不是“1
          天前”，随时间更新（秒级每秒，分钟级每 10 秒，更远的更慢，页面隐藏时停下）。
          <Code>threshold</Code> 以外直接写日期；悬停看完整的日期时间。<Code>format</Code> 是详略：
          <Code>long</Code>（默认）、<Code>short</Code>、<Code>narrow</Code>。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="countdowns" title="倒计时" demo={Countdowns}>
          <Code>Countdown</Code>{' '}
          默认显示“时:分:秒”，超过一天时前面加天数；渲染函数拿到拆好的天、时、分、秒，可以排成任意样子。
          <Code>role="timer"</Code> 默认不播报，到点时 <Code>onEnd</Code>{' '}
          调用一次（发送验证码后恢复按钮）。几个计时器对齐到整秒一起跳；
          <Code>precision="minute"</Code> 只到分、每分钟更新一次，适合以天计的期限。
        </Example>
      </ExampleColumn>
    </Examples>
    <Example id="formats" title="日期时间的写法" demo={Formats}>
      <Code>DateTime</Code> 渲染 time 元素，datetime
      属性是机器可读的值。不写格式时只有日期的值显示日期，带时间的再加上时分；值可以是
      Date、DateValue 或 ISO 字符串，按语言包的时区与日历换算。
    </Example>
    <ApiReference api={[api, relativeApi, countdownApi]} />
  </DocPage>
));
