import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/ScatterChartProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Bubbles from './demo/Bubbles.tsx?demo';
import Cities from './demo/Cities.tsx?demo';

export const meta = {
  title: 'ScatterChart 散点图',
  description:
    '看两个数值之间的关系：每一行一个点，点的大小可以再表示第三个数值（气泡图）。基于 Unovis，跟随主题；需要安装 @unovis/ts。',
  order: 5,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { ScatterChart } from '@vue-tsx-pro/ui/charts';">
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
      </ExampleColumn>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
