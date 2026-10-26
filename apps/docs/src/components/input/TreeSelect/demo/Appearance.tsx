// 前置图标、外观与状态：与 Select 同一套；isDisabled 让中心、部这一级不能选，只能选到团队
import { Building2, Users } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Field, Grid, TreeSelect } from '@zerodep-dev/vue-tsx-pro-ui';
import { orgs, type Org } from './orgs';

const accessors = {
  items: orgs,
  getKey: (org: Org) => org.id,
  getLabel: (org: Org) => org.name,
  getChildren: (org: Org) => org.children,
};

export default _component(() => {
  let team = _state<string | null>(null);
  let department = _state<string | null>('finance');
  return () => (
    <Grid minItemWidth="20rem" gap="lg">
      <Field label="承接团队" description="中心、部这一级不能选">
        <TreeSelect
          {...accessors}
          _value={team}
          isDisabled={(org) => !!org.children}
          icon={Users}
          placeholder="选择团队"
        />
      </Field>
      <Field label='variant="soft" radius="full"'>
        <TreeSelect
          {...accessors}
          _value={department}
          icon={Building2}
          variant="soft"
          radius="full"
          clearable
        />
      </Field>
      <Field label="必填" required error={team ? undefined : '请选择承接团队'}>
        <TreeSelect {...accessors} _value={team} placeholder="选择团队" />
      </Field>
      <Field label='size="sm"'>
        <TreeSelect {...accessors} _value={department} size="sm" />
      </Field>
      <Field label="只读" readonly description="能聚焦、能看，不能打开">
        <TreeSelect {...accessors} _value="finance-settle" icon={Building2} />
      </Field>
      <Field label="不可用" disabled>
        <TreeSelect {...accessors} _value="purchase" />
      </Field>
    </Grid>
  );
});
