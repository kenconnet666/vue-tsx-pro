// 单选：从组织机构树里选提出单位，可搜索；多选：勾选责任团队，勾上一个中心就是整枝，触发框里只列最上层
import { _component } from '@vue-tsx-pro/tsx';
import { Code, Field, Flex, Grid, Small, TreeSelect } from '@vue-tsx-pro/ui';
import { orgs, type Org } from './orgs';

const accessors = {
  getKey: (org: Org) => org.id,
  getLabel: (org: Org) => org.name,
  getChildren: (org: Org) => org.children,
};

export default _component(() => {
  let org = _state('composite-structure');
  let teams = _state<string[]>([
    'assembly',
    'assembly-system',
    'assembly-landing',
    'assembly-cabin',
    'cost-estimate',
  ]);
  return () => (
    <Grid minItemWidth="16rem" gap="lg">
      <Flex direction="column" gap="xs">
        <Field label="提出单位" description="打开后输入“团队”试试：命中节点的上级一起展开">
          <TreeSelect items={orgs} {...accessors} value={_bind(org)} searchable clearable />
        </Field>
        <Small tone="muted">
          值：<Code>{org || '—'}</Code>
        </Small>
      </Flex>
      <Flex direction="column" gap="xs">
        <Field label="责任团队（多选）">
          <TreeSelect
            items={orgs}
            {...accessors}
            selectionMode="multiple"
            value={_bind(teams)}
            searchable
            clearable
          />
        </Field>
        <Small tone="muted">
          勾上的全部：<Code>{teams.join('、') || '—'}</Code>
        </Small>
      </Flex>
    </Grid>
  );
});
