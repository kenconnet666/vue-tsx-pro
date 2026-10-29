import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/DonutChartProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Budget from './demo/Budget.tsx?demo';
import Sources from './demo/Sources.tsx?demo';
import Options from './demo/Options.tsx?demo';

export const meta = {
  title: 'DonutChart 环形图',
  description:
    '看各部分在整体里占多少：环形或饼图，中间写合计。自己用 SVG 画，跟随主题，没有第三方依赖。',
  order: 4,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { DonutChart } from '@zerodep-dev/vue-tsx-pro-ui/charts';"
  >
    <Examples>
      <ExampleColumn>
        <Example id="sources" title="环形图" demo={Sources}>
          每一行一个扇区，<Code>index</Code> 是名称、<Code>value</Code>{' '}
          是数值；中间的大字默认是显示中各项的合计，<Code>centerSubLabel</Code>{' '}
          是下面的小字。悬停扇区看数值与占比，点图例隐藏一项。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="budget" title="饼图" demo={Budget}>
          <Code>arcWidth={'{0}'}</Code> 画成饼图，<Code>centerLabel={'{false}'}</Code>{' '}
          不写中间的字。数值可以是 Decimal、bigint，提示框与读屏的数据表按原值显示；
          <Code>itemColor</Code> 按行给颜色，不写的按顺序取色板。
        </Example>
        <Example id="options" title="图例与状态" demo={Options}>
          <Code>hiddenItems</Code> 双向绑定图例里隐藏的块，占比按剩下的重算；<Code>height</Code>{' '}
          是高度。加载中（<Code>loading</Code>）显示骨架，没有数据时显示 <Code>empty</Code>
          （默认“暂无数据”）。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
