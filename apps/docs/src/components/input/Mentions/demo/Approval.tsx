// 审批意见里 @ 相关的人：输入 @ 弹出人员（按部门分组、带岗位说明），接着输入按名字过滤，Enter 或 Tab 选中；
// mentions 是文字里提到的人的工号——删掉“@名字”就不再通知他。下面的预览用 MentionText 高亮提及
import { _component } from '@vue-tsx-pro/tsx';
import {
  Card,
  Field,
  Flex,
  Mentions,
  MentionText,
  Small,
  Tag,
  type ListboxOption,
} from '@vue-tsx-pro/ui';

const people: ListboxOption[] = [
  { value: 'E1024', label: '周宁', description: '采购专员', group: '采购部' },
  { value: 'E1031', label: '陆川', description: '采购经理', group: '采购部' },
  { value: 'E2007', label: '方圆', description: '财务分析师', group: '财务部' },
  { value: 'E2015', label: '韩笑', description: '财务部负责人', group: '财务部' },
  { value: 'E3002', label: '林小满', description: '质量工程师', group: '质量部' },
  { value: 'E3009', label: '吴悠', description: '供应商质量', group: '质量部' },
];

export default _component(() => {
  let opinion = _state('同意按 V3 报价执行，@方圆 请把测算表更新到最新版本，');
  let notified = _state<string[]>([]);
  const nameOf = (value: string) => people.find((person) => person.value === value)?.label;
  return () => (
    <Card>
      <Flex direction="column" gap="md">
        <Field label="审批意见" description="输入 @ 提及需要知会的人，提交后会通知他们">
          <Mentions _value={opinion} _mentions={notified} items={people} rows={3} maxRows={8} />
        </Field>
        <Flex gap="xs" wrap align="center">
          <Small tone="muted">将通知：</Small>
          {notified.length === 0 ? (
            <Small tone="muted">还没有提及任何人</Small>
          ) : (
            notified.map((value) => (
              <Tag key={value} size="sm">
                {nameOf(value)}（{value}）
              </Tag>
            ))
          )}
        </Flex>
        <Flex direction="column" gap="xs">
          <Small tone="muted">预览</Small>
          <MentionText text={opinion} options={people} />
        </Flex>
      </Flex>
    </Card>
  );
});
