import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/AreaChartProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Stacked from './demo/Stacked.tsx?demo';
import Traffic from './demo/Traffic.tsx?demo';
import Options from './demo/Options.tsx?demo';

export const meta = {
  title: 'AreaChart 面积图',
  description:
    '折线下面填上颜色：看总量随时间的变化，堆叠时还能看出构成。基于 Unovis，跟随主题；需要安装 @unovis/ts。',
  order: 3,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { AreaChart } from '@vue-tsx-pro/ui/charts';">
    <Examples>
      <ExampleColumn>
        <Example id="traffic" title="重叠" demo={Traffic}>
          默认各系列重叠、半透明（<Code>opacity</Code> 默认 0.25），上沿描一条线；曲线默认平滑（
          <Code>curve</Code> 同折线图）。悬停时十字线在各片面积的上沿标出当前点。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="stacked" title="堆叠" demo={Stacked}>
          <Code>stacked</Code>{' '}
          时依次叠起，最上面是总额；数值轴按叠起来的总和取范围。点图例隐藏一个系列，其余的重新叠起。
        </Example>
        <Example id="options" title="格式、坐标轴与状态" demo={Options}>
          <Code>indexFormat</Code> 把类目换成显示文字（第二个参数是整行数据），
          <Code>valueFormat</Code> 是数值格式（这里是百分比），<Code>valueDomain</Code>{' '}
          固定数值轴的范围；<Code>grid</Code>、<Code>tooltip</Code> 可以关掉。加载中（
          <Code>loading</Code>）显示骨架，没有数据时显示 <Code>empty</Code>（默认“暂无数据”）。
          <Code>hiddenSeries</Code> 双向绑定图例里隐藏的系列。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
