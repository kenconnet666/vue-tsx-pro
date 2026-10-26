import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/TimelineProps';
import itemApi from 'virtual:api/TimelineItem';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Approval from './demo/Approval.tsx?demo';
import ChangeLog from './demo/ChangeLog.tsx?demo';
import Contract from './demo/Contract.tsx?demo';
import Order from './demo/Order.tsx?demo';
import Releases from './demo/Releases.tsx?demo';

export const meta = {
  title: 'Timeline 时间线',
  description:
    '按时间排列的事件（订单进度、操作记录、审批流转、版本历史）：节点带色调与图标，操作人、字段差异与可展开的详情，记录多时收起旧的，可左右交替、新的在前。',
  order: 6,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { Timeline } from '@zerodep-dev/vue-tsx-pro-ui';">
    <Examples>
      <ExampleColumn>
        <Example id="approval" title="审批流转记录" demo={Approval}>
          流程的流转事件每条一项：<Code>actor</Code>{' '}
          是处理人，标题写在哪个节点做了什么，处理结果按种类换 <Code>icon</Code> 与{' '}
          <Code>tone</Code>（同意、退回、催办、超时自动处理），意见写在 <Code>description</Code>
          ，附件做成链接。<Code>reverse</Code> 新的在前，items 仍按时间先后给。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="order" title="订单进度" demo={Order}>
          每项一个节点（圆点或 <Code>icon</Code>）与标题、时间、说明；<Code>dateTime</Code> 写进
          time 元素给机器读；<Code>pending</Code> 是还在进行中的最后一项。
        </Example>
        <Example id="releases" title="左右交替" demo={Releases}>
          <Code>alternate</Code> 让事件左右交替排布，<Code>tone</Code>{' '}
          给节点着色；容器窄时自动排回一侧。
        </Example>
        <Example id="contract" title="流转记录：交替、小一号" demo={Contract}>
          流转记录也是普通的 items，<Code>alternate</Code>、<Code>size</Code>、部件属性照常用。
        </Example>
      </ExampleColumn>
    </Examples>
    <Example id="change-log" title="操作记录：操作人、字段差异、收起" demo={ChangeLog}>
      项写 <Code>actor</Code> 是操作人，显示在时间前面（<Code>avatar</Code>{' '}
      是头像，文字的操作人没有头像时显示首字母）；改了哪些字段用 FieldCompare 的{' '}
      <Code>layout="list"</Code> 放进 <Code>description</Code>
      ，长的内容（完整的对比表、附件、原文）放 <Code>details</Code>
      ，项里一个“查看详情”的按钮点开才显示（打开时才渲染）。
      <Code>maxVisible</Code> 只显示最新的几项，其余收起在“展开其余 N
      条”后面，按钮在旧的那一端（倒序时在最后），展开后变成“收起”；是否展开可以用{' '}
      <Code>_expanded</Code> 绑定。
    </Example>
    <ApiReference api={[api, itemApi]} />
  </DocPage>
));
