import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/DonutChartProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { Examples } from '../../../site/Examples';
import Budget from './demo/Budget.tsx?demo';
import Sources from './demo/Sources.tsx?demo';

export const meta = {
  title: 'DonutChart 环形图',
  description:
    '看各部分在整体里占多少：环形或饼图，中间写合计。基于 Unovis，跟随主题；需要安装 @unovis/ts。',
  order: 4,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { DonutChart } from '@vue-tsx-pro/ui/charts';">
    <Examples>
      <Example id="sources" title="环形图" demo={Sources}>
        每一行一个扇区，<Code>index</Code> 是名称、<Code>value</Code>{' '}
        是数值；中间的大字默认是显示中各项的合计，<Code>centerSubLabel</Code>{' '}
        是下面的小字。悬停扇区看数值与占比，点图例隐藏一项。
      </Example>
      <Example id="budget" title="饼图" demo={Budget}>
        <Code>arcWidth={'{0}'}</Code> 画成饼图，<Code>centerLabel={'{false}'}</Code>{' '}
        不写中间的字。数值可以是 Decimal、bigint，提示框与读屏的数据表按原值显示；
        <Code>itemColor</Code> 按行给颜色，不写的按顺序取色板。
      </Example>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
