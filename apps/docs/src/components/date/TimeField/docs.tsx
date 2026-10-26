import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code, Kbd } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/TimeFieldProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { ExampleColumn, Examples } from '../../../site/Examples';
import { Example } from '../../../site/Example';
import { KeyboardReference } from '../../../site/KeyboardReference';
import { segmentKeys } from '../keyboard';
import Basic from './demo/Basic.tsx?demo';
import HourCycle from './demo/HourCycle.tsx?demo';
import States from './demo/States.tsx?demo';

export const meta = {
  title: 'TimeField 时间输入框',
  description: '分段输入时、分（可选秒），12 / 24 小时制跟随语言。营业时间、提醒时间。',
  order: 4,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { TimeField } from '@zerodep-dev/vue-tsx-pro-ui';">
    <Examples>
      <ExampleColumn>
        <Example id="basic" title="基础用法" demo={Basic}>
          值是 <Code>'HH:mm'</Code>（同原生 <Code>input type="time"</Code>），可以直接比较大小；
          <Code>min</Code> / <Code>max</Code> 之外显示出错，
          <Code>useFormat().date('21:30', {'{ timeStyle }'})</Code> 按语言显示。键盘同 DateField：打{' '}
          <Kbd>1</Kbd> <Kbd>4</Kbd> <Kbd>3</Kbd> <Kbd>0</Kbd> 就是 14:30。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="hour-cycle" title="12 / 24 小时制" demo={HourCycle}>
          12 小时制时多一段上午 / 下午：打 <Kbd>a</Kbd>、<Kbd>p</Kbd> 或用 <Kbd>↑</Kbd> <Kbd>↓</Kbd>{' '}
          切换；改“时”时保留上午下午。语言配置的 <Code>hourCycle</Code>{' '}
          统一指定，组件上的同名属性单独覆盖。
        </Example>
        <Example id="states" title="外观与状态" demo={States}>
          <Code>icon</Code>、<Code>clearable</Code>、<Code>variant</Code>、<Code>size</Code>{' '}
          与其他输入框同一套；<Code>valueType="dateValue"</Code> 写回 @internationalized/date 的
          Time。 Field 上的 <Code>required</Code>、<Code>error</Code>、<Code>readonly</Code>、
          <Code>disabled</Code> 交给里面的输入框。
        </Example>
      </ExampleColumn>
    </Examples>
    <KeyboardReference keys={segmentKeys} />
    <ApiReference api={api} />
  </DocPage>
));
