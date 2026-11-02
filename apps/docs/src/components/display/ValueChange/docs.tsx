import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/ValueChangeProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import Log from './demo/Log.tsx?demo';

export const meta = {
  title: 'ValueChange 值的变化',
  description: '一个值的变化：原值划掉、箭头、新值。放在表格单元格、操作记录、审批意见里。',
  order: 5.6,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { ValueChange } from '@zerodep-dev/vue-tsx-pro-ui';">
    <Example id="log" title="操作记录" demo={Log}>
      <Code>before</Code> 是原值，<Code>after</Code> 是新值；没有原值（新建）时只显示新值。原值是
      del、新值是 ins，中间有给读屏的“改为”。整份记录按字段对比用 <Code>FieldCompare</Code>
      ，表格里标出改过的格见 DataTable 的“数据修正”。
    </Example>
    <ApiReference api={api} />
  </DocPage>
));
