import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { Avatar, Flex, Text, TreeDataTable, type DataTableColumn } from '@vue-tsx-pro/ui';

interface Unit {
  id: string;
  name: string;
  lead: string;
  headcount: number;
  budget: number;
  // 还没加载的部门：children 为 undefined，lazy 为 true
  children?: Unit[];
  lazy?: boolean;
}

const org: Unit[] = [
  {
    id: 'rd',
    name: '研发部',
    lead: '林小满',
    headcount: 46,
    budget: 3_200_000,
    children: [
      { id: 'fe', name: '前端组', lead: '赵浩然', headcount: 12, budget: 820_000 },
      { id: 'be', name: '后端组', lead: '陈默', headcount: 18, budget: 1_300_000 },
      { id: 'qa', name: '测试组', lead: '孙思远', headcount: 8, budget: 480_000 },
    ],
  },
  { id: 'mk', name: '市场部', lead: '许悠', headcount: 21, budget: 1_800_000, lazy: true },
  { id: 'ds', name: '设计中心', lead: '周一航', headcount: 9, budget: 650_000 },
];

const columns: DataTableColumn<Unit>[] = [
  { key: 'name', header: '部门', width: 200, sortable: true },
  {
    key: 'lead',
    header: '负责人',
    width: 140,
    cell: (unit) => (
      <Flex align="center" gap="sm">
        <Avatar size="xs" name={unit.lead} />
        <Text>{unit.lead}</Text>
      </Flex>
    ),
  },
  // 数字列：按第一个值推断成 number，靠右对齐
  { key: 'headcount', header: '人数', width: 80, sortable: true },
  // 预算以元存、按万元显示：format 缩放，单位写在表头里，一列数字更整齐
  {
    key: 'budget',
    header: '年度预算（万元）',
    width: 150,
    format: { scale: 10_000, minimumFractionDigits: 1, maximumFractionDigits: 1 },
    sortable: true,
  },
];

const styles = stylex.create({ table: { maxHeight: '20rem' } });

export default _component(() => {
  let rows = _state(org);
  let expanded = _state(['rd']);
  // 懒加载：展开还没有子项的部门时取回来、放进数据里；返回 Promise 时展开按钮显示加载中
  const loadChildren = (unit: Unit) =>
    new Promise<void>((resolve) =>
      setTimeout(() => {
        rows = rows.map((item) =>
          item.id === unit.id
            ? {
                ...item,
                lazy: false,
                children: [
                  { id: 'brand', name: '品牌组', lead: '王晴', headcount: 7, budget: 900_000 },
                  { id: 'channel', name: '渠道组', lead: '李雨桐', headcount: 14, budget: 900_000 },
                ],
              }
            : item,
        );
        resolve();
      }, 900),
    );
  return () => (
    <TreeDataTable
      rows={rows}
      columns={columns}
      rowKey={(unit) => unit.id}
      getChildren={(unit) => unit.children}
      hasChildren={(unit) => !!unit.children?.length || !!unit.lazy}
      loadChildren={loadChildren}
      expanded={_bind(expanded)}
      aria-label="组织架构"
      propsRoot={{ sx: styles.table }}
    />
  );
});
