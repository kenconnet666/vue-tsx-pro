// renderValue 自己画触发框里的内容：前面几级淡一些、最后一级正常——一眼先看到选的是什么；
// filter 换搜索的匹配方式：这里路径上任何一级的名称或编号对得上都算。外观与状态同其他输入框
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Cascader, Field, Grid, Text } from '@zerodep-dev/vue-tsx-pro-ui';

interface Org {
  code: string;
  name: string;
  children?: Org[];
}

const orgs: Org[] = [
  {
    code: 'MFG',
    name: '制造中心',
    children: [
      {
        code: 'MFG-1',
        name: '一工厂',
        children: [
          { code: 'MFG-1-ST', name: '冲压车间' },
          { code: 'MFG-1-WD', name: '焊装车间' },
        ],
      },
      { code: 'MFG-2', name: '二工厂', children: [{ code: 'MFG-2-AS', name: '总装车间' }] },
    ],
  },
  {
    code: 'RD',
    name: '研发中心',
    children: [
      { code: 'RD-HW', name: '硬件部' },
      { code: 'RD-SW', name: '软件部' },
    ],
  },
];

const accessors = {
  getKey: (org: Org) => org.code,
  getLabel: (org: Org) => org.name,
  getChildren: (org: Org) => org.children,
};

export default _component(() => {
  let dept = _state<readonly string[] | null>(['MFG', 'MFG-1', 'MFG-1-WD']);
  let cost = _state<readonly string[] | null>(null);
  return () => (
    <Grid minItemWidth="16rem" gap="lg">
      <Field label="所属部门" description="搜索认名称也认编号：试试“焊装”“RD”">
        <Cascader
          {...accessors}
          items={orgs}
          _value={dept}
          searchable
          clearable
          filter={(nodes, query) =>
            nodes.some((org) => org.name.includes(query) || org.code.includes(query.toUpperCase()))
          }
          renderValue={(labels) => (
            <>
              {labels.length > 1 && <Text tone="muted">{labels.slice(0, -1).join(' / ')} / </Text>}
              {labels.at(-1)}
            </>
          )}
        />
      </Field>
      <Field label="成本中心" required error={cost ? undefined : '请选择成本中心'}>
        <Cascader {...accessors} items={orgs} _value={cost} variant="soft" radius="full" />
      </Field>
      <Field label="只读" readonly>
        <Cascader {...accessors} items={orgs} _value={['RD', 'RD-SW']} />
      </Field>
      <Field label="不可用" disabled>
        <Cascader {...accessors} items={orgs} _value={['RD', 'RD-HW']} />
      </Field>
    </Grid>
  );
});
