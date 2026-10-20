import { _component } from '@vue-tsx-pro/tsx';
import { Code, Kbd } from '@vue-tsx-pro/ui';
import api from 'virtual:api/TimePickerProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import Meeting from './demo/Meeting.tsx?demo';

export const meta = {
  title: 'TimePicker 时间选择器',
  description: '输入框加按步长列出的时间：常用的整点、半点点一下，其余的直接键入。',
  order: 7,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { TimePicker } from '@vue-tsx-pro/ui';">
    <Example id="meeting" title="基础用法" demo={Meeting}>
      列表从 <Code>min</Code> 到 <Code>max</Code> 每 <Code>step</Code> 分钟一项（默认 30），按语言或{' '}
      <Code>hourCycle</Code> 的小时制显示；打开时高亮当前的值，
      <Kbd>↑</Kbd> <Kbd>↓</Kbd> 移动、<Kbd>Enter</Kbd> 选中，“此刻”选当前时间。输入框就是
      TimeField，列表之外的时间照样键入。
    </Example>
    <ApiReference api={api} />
  </DocPage>
));
