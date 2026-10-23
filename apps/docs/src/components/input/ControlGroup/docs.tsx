import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/ControlGroupProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Amount from './demo/Amount.tsx?demo';
import Search from './demo/Search.tsx?demo';

export const meta = {
  title: 'ControlGroup 组合输入',
  description:
    '输入框、选择框、按钮连成一条、共用边框：币种 + 金额、搜索范围 + 关键词 + 搜索、协议 + 域名。',
  order: 13,
};

export default _component(() => () => (
  <DocPage meta={meta} imports="import { ControlGroup } from '@vue-tsx-pro/ui';">
    <Examples>
      <ExampleColumn>
        <Example id="amount" title="币种与金额" demo={Amount}>
          组里的输入框与按钮去掉相邻一侧的圆角、边框叠在一起，聚焦的那个浮到上面，焦点环完整。输入框分掉剩余宽度，选择框与按钮按内容宽。每个控件写自己的{' '}
          <Code>aria-label</Code>，组的名称写在 <Code>ControlGroup</Code> 上（role="group"）；放进{' '}
          <Code>Field</Code> 时组接 Field 的标签与说明（经 aria-labelledby /
          aria-describedby），点标签聚焦第一个控件。只有文字的单位、币种符号用输入框自己的{' '}
          <Code>prefix</Code> / <Code>suffix</Code>
          ，不必拆成两个控件。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="search" title="搜索框、地址与竖排" demo={Search}>
          搜索放在 <Code>{'<form role="search">'}</Code>{' '}
          里，回车与按钮都能提交。复制按钮这类图标按钮同样相连。
          <Code>orientation="vertical"</Code> 上下相连，适合分成几行填写的地址。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
