import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/TimelineProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { Examples } from '../../../site/Examples';
import Order from './demo/Order.tsx?demo';
import Releases from './demo/Releases.tsx?demo';

export const meta = {
  title: 'Timeline 时间线',
  description:
    '按时间排列的事件（订单进度、操作记录、版本历史）：节点带色调与图标，可左右交替，进行中的一项显示加载指示。',
  order: 6,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { Timeline } from '@vue-tsx-pro/ui';">
    <Examples>
      <Example id="order" title="订单进度" demo={Order}>
        每项一个节点（圆点或 <Code>icon</Code>）与标题、时间、说明；<Code>dateTime</Code> 写进 time
        元素给机器读；<Code>pending</Code> 是还在进行中的最后一项。
      </Example>
      <Example id="releases" title="左右交替" demo={Releases}>
        <Code>alternate</Code> 让事件左右交替排布，<Code>tone</Code>{' '}
        给节点着色；容器窄时自动排回一侧。
      </Example>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
