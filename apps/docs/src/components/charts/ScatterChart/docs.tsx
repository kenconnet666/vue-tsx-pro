import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/ScatterChartProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Bubbles from './demo/Bubbles.tsx?demo';
import Cities from './demo/Cities.tsx?demo';
import Options from './demo/Options.tsx?demo';

export const meta = {
  title: 'ScatterChart 散点图',
  description:
    '看两个数值之间的关系：每一行一个点，点的大小可以再表示第三个数值（气泡图）。基于 Unovis，跟随主题；需要安装 @unovis/ts。',
  order: 5,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { ScatterChart } from '@zerodep-dev/vue-tsx-pro-ui/charts';"
  >
    <Examples>
      <ExampleColumn>
        <Example id="cities" title="基础用法" demo={Cities}>
          <Code>x</Code> 是横轴的数值字段，<Code>series</Code>{' '}
          的每一项是纵轴的一个字段；纵轴不强制从 0 起。悬停一个点，提示框列出这一行的名称（
          <Code>index</Code>）、横轴与各系列的值。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="bubbles" title="气泡图" demo={Bubbles}>
          <Code>size</Code> 给成字段时，点的大小在 6–32px
          之间随它缩放；几个系列各用一个颜色，某一行在某个系列上没有值就不画那个点。
        </Example>
        <Example id="options" title="坐标、单位与状态" demo={Options}>
          <Code>xLabel</Code> 显示在横轴下方，<Code>unit</Code>{' '}
          显示在数值轴上方、提示框里跟在数值后面；<Code>valueDomain</Code> 固定数值轴的范围，
          <Code>indexFormat</Code> 改提示框的标题。图例、网格线、提示框都能关。加载中（
          <Code>loading</Code>
          ）显示骨架，没有数据时显示 <Code>empty</Code>（默认“暂无数据”）。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
