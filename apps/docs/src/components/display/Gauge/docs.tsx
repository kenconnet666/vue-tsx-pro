import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code, Link } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/GaugeProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import Dashboard from './demo/Dashboard.tsx?demo';
import Sizes from './demo/Sizes.tsx?demo';

export const meta = {
  title: 'Gauge 仪表盘',
  description:
    '半圆的刻度上显示一个量落在哪个区间（完成率、利用率、风险分）：分段的区间、当前值、目标刻度。纯 SVG，读屏按 meter 念。',
  order: 11.6,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { Gauge } from '@zerodep-dev/vue-tsx-pro-ui';">
    <Example id="dashboard" title="工作台的一排仪表盘" demo={Dashboard}>
      <Code>value</Code> 在 <Code>min</Code>–<Code>max</Code>（默认 0–100）之间；<Code>bands</Code>{' '}
      是外圈的区间（每段到 <Code>to</Code> 为止，带色调），数值弧取它所在区间的色调（
      <Code>tone</Code> 可以指定）；<Code>target</Code> 在外圈上画一道刻度。<Code>valueFormat</Code>
      、<Code>unit</Code> 决定中间与读屏的数值写法。和{' '}
      <Link href="/components/progress">Progress</Link> 的分工：Progress 是做到哪了，Gauge
      是一个量处在好坏的哪一段。
    </Example>
    <Example id="sizes" title="大小与中间的文字" demo={Sizes}>
      宽 10em，随字号缩放：<Code>size</Code> 档位或外层的字号。<Code>valueLabel</Code>{' '}
      换掉中间的文字；读屏仍念 <Code>aria-valuetext</Code>（格式化的数值与目标）。
    </Example>
    <ApiReference api={api} />
  </DocPage>
));
