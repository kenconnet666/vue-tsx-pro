import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code, Kbd } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/TimePickerProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import { KeyboardReference } from '../../../site/KeyboardReference';
import { pickerKeys, segmentKeys } from '../keyboard';
import Meeting from './demo/Meeting.tsx?demo';
import States from './demo/States.tsx?demo';

export const meta = {
  title: 'TimePicker 时间选择器',
  description: '输入框加按步长列出的时间：常用的整点、半点点一下，其余的直接键入。',
  order: 7,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { TimePicker } from '@zerodep-dev/vue-tsx-pro-ui';">
    <Examples>
      <ExampleColumn>
        <Example id="meeting" title="基础用法" demo={Meeting}>
          列表从 <Code>min</Code> 到 <Code>max</Code> 每 <Code>step</Code> 分钟一项（默认
          30），按语言或 <Code>hourCycle</Code> 的小时制显示；打开时高亮当前的值，
          <Kbd>↑</Kbd> <Kbd>↓</Kbd> 移动、<Kbd>Enter</Kbd> 选中，“此刻”选当前时间。输入框就是
          TimeField，列表之外的时间照样键入。<Code>isTimeUnavailable</Code>{' '}
          标出不可选的时间（午休、已约满的时段）：列表里不可用，键入时显示出错；DateField、DatePicker
          带时间时也有，参数多一个那一天的日期。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="states" title="精度、值的类型与状态" demo={States}>
          <Code>granularity</Code> 是 <Code>hour</Code>、<Code>minute</Code>（默认）或{' '}
          <Code>second</Code>，输入框的段与列表一起变；<Code>valueType="dateValue"</Code> 写回
          @internationalized/date 的 Time 对象。外观与只读、不可用同其他输入框。
        </Example>
      </ExampleColumn>
    </Examples>
    <KeyboardReference
      keys={[
        ...segmentKeys,
        ...pickerKeys,
        ['↑ / ↓', '列表打开时：移动高亮'],
        ['Enter', '列表打开时：选中高亮的时间并关闭'],
      ]}
    />
    <ApiReference api={api} />
  </DocPage>
));
