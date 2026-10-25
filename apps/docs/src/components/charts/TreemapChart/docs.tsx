import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/TreemapChartProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import Savings from './demo/Savings.tsx?demo';

export const meta = {
  title: 'TreemapChart 矩形树图',
  description:
    '一个总量按层级分块（区域 → 供应商、科目 → 明细），块的面积是数值，一眼看出谁占得多。',
  order: 10.7,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { TreemapChart } from '@vue-tsx-pro/ui/charts';">
    <Example id="savings" title="采购额构成" demo={Savings}>
      <Code>data</Code> 是扁平的明细，<Code>groups</Code> 是从外到内分组的字段，<Code>value</Code>{' '}
      是面积的数值字段。同一个顶层分组同一种颜色（按色板），里面的块按亮度区分；
      <Code>groupLabels</Code>{' '}
      让外层分组也写上名字。悬停看路径、数值与占比，点图例隐藏一个顶层分组（占比按剩下的算）；读屏的数据表列出每一块。
    </Example>
    <ApiReference api={api} />
  </DocPage>
));
