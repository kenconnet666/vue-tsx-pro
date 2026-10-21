import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/LineChartProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { ExampleColumn, Examples } from '../../../site/Examples';
import { Example } from '../../../site/Example';
import Basic from './demo/Basic.tsx?demo';
import Curves from './demo/Curves.tsx?demo';
import Gaps from './demo/Gaps.tsx?demo';
import Palette from './demo/Palette.tsx?demo';
import Options from './demo/Options.tsx?demo';

export const meta = {
  title: 'LineChart 折线图',
  description:
    '看数值随时间的变化趋势：直线、平滑或阶梯，可带数据点。基于 Unovis，跟随主题；需要安装 @unovis/ts。',
  order: 2,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { LineChart } from '@vue-tsx-pro/ui/charts';">
    <Examples>
      <ExampleColumn>
        <Example id="basic" title="基础用法" demo={Basic}>
          每行是一个时间点，每个系列一条线。悬停时十字线在各条线上标出当前点，提示框列出各系列的值；
          <Code>dots="hollow"</Code> 画出空心的数据点。
        </Example>
        <Example id="curves" title="线的形状" demo={Curves}>
          <Code>curve</Code>：<Code>linear</Code> 折线、<Code>monotone</Code>{' '}
          平滑（不会越过数据点）、
          <Code>step</Code> 阶梯（值保持到下一个点才跳变）。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="gaps" title="缺失的数据" demo={Gaps}>
          值为 <Code>null</Code> 或 <Code>undefined</Code> 的点不画，线在这里断开，不会被当成 0。
          <Code>valueFormat</Code> 设成百分比，<Code>valueDomain</Code> 收窄数值轴，变化更明显。
        </Example>
        <Example id="palette" title="多个系列" demo={Palette}>
          系列按顺序取图表色板的 8 种颜色，各色在亮色、暗色、纸张主题的背景上都满足 3:1
          的图形对比度。
        </Example>
        <Example id="options" title="线宽、图例与状态" demo={Options}>
          <Code>lineWidth</Code> 是线宽（像素）；<Code>legend</Code>{' '}
          默认多于一个系列时显示，点图例隐藏、恢复系列；
          <Code>grid</Code>、<Code>tooltip</Code> 可以关掉。加载中（<Code>loading</Code>
          ）显示骨架，没有数据时显示 <Code>empty</Code>（默认“暂无数据”）。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
