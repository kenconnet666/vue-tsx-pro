// 操作记录：每条写出改了什么，原值划掉、箭头、新值；新建的字段只有新值
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Descriptions, ValueChange } from '@zerodep-dev/vue-tsx-pro-ui';

const items = [
  { label: '单价', value: <ValueChange before="¥1,200.00" after="¥1,350.00" /> },
  { label: '交期', value: <ValueChange before="2026-11-08" after="2026-11-20" /> },
  { label: '负责人', value: <ValueChange before="林晓" after="周航" /> },
  { label: '备注', value: <ValueChange after="供应商产能不足，交期顺延" /> },
];

export default _component(() => () => <Descriptions items={items} columns={1} />);
