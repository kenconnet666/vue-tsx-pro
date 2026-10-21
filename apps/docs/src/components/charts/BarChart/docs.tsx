import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/BarChartProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { ExampleColumn, Examples } from '../../../site/Examples';
import { Example } from '../../../site/Example';
import Basic from './demo/Basic.tsx?demo';
import Colors from './demo/Colors.tsx?demo';
import Horizontal from './demo/Horizontal.tsx?demo';
import Legend from './demo/Legend.tsx?demo';
import Stacked from './demo/Stacked.tsx?demo';
import States from './demo/States.tsx?demo';

export const meta = {
  title: 'BarChart 柱状图',
  description:
    '比较各类目的数值：分组或堆叠，竖向或横向。基于 Unovis，颜色、字体、提示框都跟随主题；需要安装 @unovis/ts。',
  order: 1,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { BarChart } from '@vue-tsx-pro/ui/charts';">
    <Examples>
      <ExampleColumn>
        <Example id="basic" title="基础用法" demo={Basic}>
          <Code>data</Code> 的每一行是一个类目，<Code>index</Code> 指定类目字段，
          <Code>series</Code> 的每一项是一个数值字段（number、bigint 或 Decimal：画图时换成
          number，提示框与读屏的数据表按原值显示，金额不丢精度）。<Code>unit</Code>{' '}
          显示在数值轴上方，提示框里的数值也会带上；悬停一个类目时提示框列出这一组的全部系列。
        </Example>
        <Example id="stacked" title="堆叠" demo={Stacked}>
          <Code>stacked</Code> 把同一类目的系列叠成一根柱子，看总量与构成。
        </Example>
        <Example id="horizontal" title="横向" demo={Horizontal}>
          类目名较长或类目较多时用 <Code>orientation="horizontal"</Code>，名称不用折行或倾斜。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="colors" title="颜色" demo={Colors}>
          系列默认按顺序取主题的图表色板（<Code>chart1</Code>–<Code>chart8</Code>
          ，第一个跟随品牌色）；
          <Code>color</Code> 可以指定色板里的一个，或任意 CSS 颜色，如表示“支出”的危险色。
        </Example>
        <Example id="legend" title="图例" demo={Legend}>
          点图例隐藏、恢复系列；<Code>hiddenSeries</Code> 可以用 <Code>_bind</Code>{' '}
          双向绑定，记住用户的选择或由外部控制。多于一个系列时才显示图例，<Code>legend</Code>{' '}
          可以强制显示或隐藏。
        </Example>
        <Example id="states" title="加载与空状态" demo={States}>
          <Code>loading</Code> 时绘图区显示一排高低不一的骨架柱并扫光（折线图是一整块），图表带{' '}
          <Code>aria-busy</Code>；没有数据时显示“暂无数据”，<Code>empty</Code>{' '}
          可以换成自己的内容（如带操作按钮的 Empty）。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
