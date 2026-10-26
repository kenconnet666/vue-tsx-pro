// 直接放在页面里的面板：流程节点的处理人选岗位（岗位收件箱），types={['position', 'user']} 时岗位与人员都能勾，
// 最多 3 个；勾满之后其余的勾选框不可用。“岗位”页列出全部岗位，“全选”只管这一页能勾的
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  localPeopleSource,
  PeoplePickerPanel,
  type PeopleEntry,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { org, positions } from './org';

const source = localPeopleSource(org, positions);

export default _component(() => {
  let assignees = _state<readonly PeopleEntry[]>([
    { id: 'p-buyer', type: 'position', name: '采购专员', description: '采购部' },
  ]);
  return () => (
    <PeoplePickerPanel
      source={source}
      _value={assignees}
      types={['position', 'user']}
      max={3}
      listHeight="16rem"
      aria-label="处理人"
    />
  );
});
