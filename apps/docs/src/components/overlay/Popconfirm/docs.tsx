import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/PopconfirmProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import { KeyboardReference } from '../../../site/KeyboardReference';
import Members from './demo/Members.tsx?demo';
import Variants from './demo/Variants.tsx?demo';

export const meta = {
  title: 'Popconfirm 气泡确认',
  description:
    '在触发按钮旁边问一句再执行：移出成员、撤回、清空这类有后果但不必弹对话框的操作。确认可以等接口返回，失败时保持打开。',
  order: 3,
};

export default _component(() => () => (
  <DocPage meta={meta} imports="import { Popconfirm } from '@vue-tsx-pro/ui';">
    <Examples>
      <ExampleColumn>
        <Example id="members" title="移出成员" demo={Members}>
          <Code>trigger</Code> 同 Popover：把收到的 props 展开到按钮上。<Code>onConfirm</Code> 返回
          Promise 时确认按钮加载中、取消暂不可用，完成后关闭；返回 <Code>false</Code>
          （或失败）时保持打开，可以再试或取消，失败原因由调用方提示（这里用
          Toast）。打开时焦点落在“取消”上，误按 Enter 不会执行。弹出层是
          role="alertdialog"，以问题为名称、说明为描述。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="variants" title="色调、图标与位置" demo={Variants}>
          <Code>tone</Code> 决定图标与确认按钮的颜色，默认 warning，删除这类用 danger；
          <Code>icon</Code> 换图标，<Code>false</Code> 不显示。<Code>placement</Code> 默认在上方，
          <Code>arrow</Code> 加指向触发器的箭头。<Code>onCancel</Code> 在点取消、点外面、按 Esc
          时调用。后果严重、要多写几句或填理由的用 AlertDialog / useConfirm。
        </Example>
      </ExampleColumn>
    </Examples>
    <KeyboardReference
      keys={[
        ['Enter / Space', '在触发按钮上：打开；打开后焦点在“取消”上'],
        ['Tab', '在取消与确认之间移动'],
        ['Esc', '取消并关闭，焦点回到触发按钮'],
      ]}
    />
    <ApiReference api={api} />
  </DocPage>
));
