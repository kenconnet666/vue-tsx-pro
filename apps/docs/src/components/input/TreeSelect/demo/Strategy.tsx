// 通知范围：同样勾上“总装制造中心”整枝加一个测算组，三种取法提交的值不同；标签一行放不下时收进“+N”
import { _component } from '@vue-tsx-pro/tsx';
import {
  checkedByStrategy,
  Code,
  Field,
  Flex,
  Small,
  ToggleGroup,
  ToggleItem,
  TreeSelect,
  indexTree,
  type CheckStrategies,
} from '@vue-tsx-pro/ui';
import { orgs, type Org } from './orgs';

const strategies: [keyof CheckStrategies, string][] = [
  ['all', '全部（默认）'],
  ['parent', '整枝只要父节点'],
  ['child', '只要叶子'],
];

const accessors = {
  getKey: (org: Org) => org.id,
  getLabel: (org: Org) => org.name,
  getChildren: (org: Org) => org.children,
};

// 勾上的全部节点；按取法整理后才是提交的值
const initial = [
  'assembly',
  'assembly-system',
  'assembly-landing',
  'assembly-cabin',
  'cost-estimate',
];

export default _component(() => {
  let strategy = _state<keyof CheckStrategies>('parent');
  let scope = _state<string[]>(checkedByStrategy(indexTree(orgs, accessors), initial, 'parent'));
  return () => (
    <Flex direction="column" gap="md">
      <ToggleGroup
        value={_bind(
          () => strategy,
          (next: string) => {
            strategy = next as keyof CheckStrategies;
            // 换取法后按新的取法整理同一批勾选（演示用；实际表单里取法是固定的）
            scope = checkedByStrategy(indexTree(orgs, accessors), initial, strategy);
          },
        )}
        size="sm"
        required
        aria-label="checkedStrategy"
      >
        {strategies.map(([value, label]) => (
          <ToggleItem key={value} value={value}>
            {label}
          </ToggleItem>
        ))}
      </ToggleGroup>
      <Field label="通知范围" description="点标签的 × 取消整枝；Backspace 移除最后一个">
        <TreeSelect
          key={strategy}
          items={orgs}
          {...accessors}
          selectionMode="multiple"
          checkedStrategy={strategy}
          maxTagCount="responsive"
          value={_bind(scope)}
          searchable
          clearable
        />
      </Field>
      <Small tone="muted">
        提交的值：<Code>{scope.join('、') || '—'}</Code>
      </Small>
    </Flex>
  );
});
