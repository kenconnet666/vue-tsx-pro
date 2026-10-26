// 表单字段：抄送可以选人员与部门，触发框里是已选的标签；点开对话框，按组织架构一层层找或搜索，右边是已选的，
// 按“确定”才写回。recentKey 记下最近选过的（“最近”页）。经办人 max={1} 只选一个，触发框里直接是名字
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Field,
  Flex,
  localPeopleSource,
  PeoplePicker,
  Small,
  type PeopleEntry,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { org, roles } from './org';

const source = localPeopleSource(org, roles);

export default _component(() => {
  let cc = _state<readonly PeopleEntry[]>([
    { id: 'u-lin', type: 'user', name: '林晓', description: '采购部 · 经理' },
    { id: 'd-qa', type: 'department', name: '质量部', description: '公司' },
  ]);
  let owner = _state<readonly PeopleEntry[]>([]);
  return () => (
    <Flex direction="column" gap="md">
      <Field label="抄送">
        <PeoplePicker
          source={source}
          _value={cc}
          types={['user', 'department']}
          recentKey="docs-cc"
        />
      </Field>
      <Field label="经办人" description="只能选一个人">
        <PeoplePicker source={source} _value={owner} max={1} placeholder="选择经办人" />
      </Field>
      <Small tone="muted">
        抄送：
        {cc
          .map((entry) => `${entry.name}（${entry.type === 'user' ? '人员' : '部门'}）`)
          .join('、') || '无'}
      </Small>
    </Flex>
  );
});
