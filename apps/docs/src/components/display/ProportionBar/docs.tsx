import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/ProportionBarProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import Pool from './demo/Pool.tsx?demo';

export const meta = {
  title: 'ProportionBar 比例条',
  description:
    '一根横条按各部分的数量分段，下面是图例：看一个总数由哪几块构成（工单的三种状态、存储空间）。',
  order: 15,
};

export default _component(() => () => (
  <DocPage meta={meta} imports="import { ProportionBar } from '@vue-tsx-pro/ui';">
    <Example id="pool" title="构成" demo={Pool}>
      <Code>segments</Code> 互斥、加起来是总数；颜色用 <Code>tone</Code>（状态色）或{' '}
      <Code>color</Code>
      （任意颜色）。横条对读屏是一张图，名称后面自动带上各段的数量；图例是普通文字，
      <Code>valueText</Code> 改数量的写法，<Code>legendExtra</Code> 在图例项后面补一句。数量为 0
      的段不画但留在图例里。要比较趋势、多个总数时用图表。
    </Example>
    <ApiReference api={api} />
  </DocPage>
));
