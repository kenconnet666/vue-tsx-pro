import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import api from 'virtual:api/DataTableProps';
import ValueLedger from './frames/ValueLedger.tsx?demo';

export const meta = {
  title: 'Value Ledger 一本账',
  description:
    '机会、预测、承诺、实现四栏分开挂账，挂账待定写“待定价”；一个视图只有一种单位、一种金额口径，底部只按栏合计、不跨栏相加。',
  order: 7,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { DataTable, Tabs, ToggleGroup } from '@vue-tsx-pro/ui';"
  >
    <Example id="ledger" title="一本账" demo={ValueLedger} frame="40rem">
      顶栏页签是单机降本（万元）与降 DMC（美元 / FH），金额口径（硬节约、成本规避、软节约）用{' '}
      <Code>ToggleGroup</Code>{' '}
      一次看一种：这样合计里不会混单位、混口径。每一项的金额只落在所属状态那一栏（四栏的{' '}
      <Code>value</Code> 只在状态相符时有值），底部是 <Code>summary: 'sum'</Code>{' '}
      的按栏合计（Decimal 精确相加）；挂账待定一栏写“待定价”，合计写几项待定价，不写
      0。机会值是渠道里还没进任务池的建议与方案，没有详情页；任务池里的编码链到项目详情，终止的项目不上账。
    </Example>
    <ApiReference api={api} />
  </DocPage>
));
