import { Bug, CircleDot, Lightbulb, Wrench } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import {
  Avatar,
  Field,
  Flex,
  Grid,
  Select,
  Small,
  Text,
  type ListboxOption,
} from '@vue-tsx-pro/ui';

interface Member {
  id: string;
  name: string;
  team: string;
}

const members: Member[] = [
  { id: 'zyh', name: '周一航', team: '设计' },
  { id: 'xy', name: '许悠', team: '设计' },
  { id: 'lxm', name: '林小满', team: '前端' },
  { id: 'zhr', name: '赵浩然', team: '前端' },
  { id: 'cm', name: '陈默', team: '后端' },
];

const types: ListboxOption[] = [
  { value: 'bug', label: '缺陷', icon: Bug, description: '功能不符合预期' },
  { value: 'feature', label: '需求', icon: Lightbulb, description: '新功能或改进' },
  { value: 'chore', label: '杂项', icon: Wrench, description: '依赖升级、重构' },
  { value: 'question', label: '咨询', icon: CircleDot, disabled: true },
];

const labels = ['紧急', '前端', '后端', '设计', '文档', '性能', '无障碍'];

export default _component(() => {
  let type = _state('bug');
  let assignee = _state<string | null>('lxm');
  let tags = _state<string[]>(['前端', '无障碍']);
  return () => (
    <Flex direction="column" gap="md">
      <Grid minItemWidth="13rem" gap="md">
        <Field label="类型">
          <Select items={types} _value={_bind(type)} />
        </Field>
        <Field label="负责人">
          <Select
            items={members}
            toOption={(member) => ({ value: member.id, label: member.name, group: member.team })}
            _value={_bind(assignee)}
            placeholder="未分配"
            clearable
          >
            {(member) => (
              <Flex align="center" gap="sm">
                <Avatar size="xs" name={member.name} />
                <Text>{member.name}</Text>
              </Flex>
            )}
          </Select>
        </Field>
      </Grid>
      <Field label="标签" description="多选：已选的在触发框里显示成标签">
        <Select items={labels} selectionMode="multiple" _value={_bind(tags)} clearable />
      </Field>
      <Small tone="muted">
        {type} · {assignee ?? '未分配'} · {tags.join('、') || '无标签'}
      </Small>
    </Flex>
  );
});
