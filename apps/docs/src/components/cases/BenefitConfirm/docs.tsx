import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import toggleApi from 'virtual:api/ToggleGroupProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import BenefitConfirm from './frames/BenefitConfirm.tsx?demo';

export const meta = {
  title: 'Benefit Confirm 收益认定',
  description:
    '成本团队的表格页：待认定、已认定、退回三个页签，一页一种单位；认定按最新一版测算锁定 A，退回要写原因，验证完成后 10 个工作日内认定。',
  order: 6,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { DataTable, Dialog, Tabs, ToggleGroup, useConfirm } from '@vue-tsx-pro/ui';"
  >
    <Example id="confirm" title="收益认定" demo={BenefitConfirm} frame="40rem">
      顶栏的页签是待认定、已认定、退回，条数只在页签上；单机降本（万元）与降 DMC（美元 / FH）用{' '}
      <Code>ToggleGroup</Code> 切换，一页只有一种单位。待认定的剩余工作日按验证完成日期起算（10
      个工作日，不含周末），超期标红；“认定并锁定 A”用 <Code>useConfirm</Code>{' '}
      写清锁定的金额，确认后任务推进到已认定；“退回”在 <Code>Dialog</Code>{' '}
      里写原因（焦点直接落在原因上），任务回到验证中、验证窗结论作废，原因记在“退回”页签。编码链到项目详情。
    </Example>
    <ApiReference api={toggleApi} />
  </DocPage>
));
