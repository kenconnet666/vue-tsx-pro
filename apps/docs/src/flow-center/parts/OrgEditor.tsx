/**
 * 组织维护（管理页）：左边部门树，右边选中部门（含下级部门）的员工；新建、编辑部门与员工，删空的部门。
 * 改动经 Worker 写进库（组织目录校验：上级不能绕成圈、有人的部门不能删），引擎马上按新的组织找处理人。
 */
import { Building2, Pencil, Plus, Trash2 } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { DepartmentRow, EmployeeRow, OrgSnapshot } from '@zerodep-dev/flow-ts-engine/org';
import {
  Badge,
  Button,
  Card,
  DataTable,
  Flex,
  Tree,
  useConfirm,
  type DataTableColumn,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { useFormDialog, type FormDialogField } from '@zerodep-dev/vue-tsx-pro-ui/patterns';
import { useFlowCenter } from '../runtime/center';
import { who } from './labels';
import { showError, toaster } from './toaster';

const styles = css.create({
  layout: {
    display: 'grid',
    gap: '_lg',
    gridTemplateColumns: { default: '1fr', '@media (min-width: 64rem)': '18rem minmax(0, 1fr)' },
    alignItems: 'start',
  },
  tree: { height: '28rem' },
});

/** 部门树的节点 */
interface DepartmentNode {
  department: DepartmentRow;
  children: DepartmentNode[];
}

function treeOf(org: OrgSnapshot, parent: string | null): DepartmentNode[] {
  return org.departments
    .filter((d) => d.parentId === parent)
    .map((department) => ({ department, children: treeOf(org, department.id) }));
}

/** 部门和它下面的全部部门 */
function subtree(org: OrgSnapshot, id: string): Set<string> {
  const found = new Set([id]);
  for (const at of found) for (const d of org.departments) if (d.parentId === at) found.add(d.id);
  return found;
}

export const OrgEditor = _component(() => {
  const center = useFlowCenter();
  const prompt = useFormDialog();
  const confirm = useConfirm();
  let selected = _state<string[]>([]);
  // 部门不多：一开始全部展开
  let expanded = _state<string[]>(center.state.org?.departments.map((d) => d.id) ?? []);

  const org = () => center.state.org!;
  const departmentName = (id: string | null) =>
    org().departments.find((d) => d.id === id)?.name ?? '';
  const roleNames = (ids: readonly string[]) =>
    ids.map((id) => org().roles.find((r) => r.id === id)?.name ?? id);

  /** 改组织：成功提示，失败（不合规）提示原因 */
  async function save(done: string, work: () => Promise<void>) {
    try {
      await work();
      toaster.success(done);
    } catch (error) {
      showError(error);
    }
  }

  async function editDepartment(current?: DepartmentRow) {
    // 上级不能选它自己和它下面的部门（库里也会查）
    const excluded = current ? subtree(org(), current.id) : new Set<string>();
    const fields: FormDialogField[] = [
      ...(current
        ? []
        : [{ name: 'id', label: '部门编码', required: true, placeholder: '如 80' } as const]),
      { name: 'name', label: '名称', required: true, defaultValue: current?.name },
      {
        name: 'parentId',
        label: '上级部门',
        type: 'select',
        defaultValue: current?.parentId ?? selected[0],
        options: org()
          .departments.filter((d) => !excluded.has(d.id))
          .map((d) => ({ value: d.id, label: d.name })),
      },
      {
        name: 'headId',
        label: '负责人',
        type: 'select',
        defaultValue: current?.headId ?? undefined,
        options: [...center.people()],
      },
    ];
    const answers = await prompt({
      title: current ? `编辑部门：${current.name}` : '新部门',
      fields,
      confirmText: '保存',
    });
    if (!answers) return;
    const values = answers as Record<string, string>;
    await save('已保存部门', () =>
      center.editOrg('saveDepartment', {
        id: current?.id ?? values['id']!.trim(),
        name: values['name']!.trim(),
        parentId: values['parentId'] || null,
        headId: values['headId'] || null,
        sort: current?.sort ?? org().departments.length,
      }),
    );
  }

  async function removeDepartment(department: DepartmentRow) {
    const ok = await confirm({
      title: `删掉“${department.name}”？`,
      description: '只有下面没有部门、也没有员工时能删。',
      tone: 'danger',
      confirmText: '删除',
    });
    if (!ok) return;
    await save('已删除部门', async () => {
      await center.editOrg('removeDepartment', department.id);
      selected = [];
    });
  }

  async function editEmployee(current?: EmployeeRow) {
    const fields: FormDialogField[] = [
      ...(current
        ? []
        : [{ name: 'id', label: '工号', required: true, placeholder: '如 1023' } as const]),
      { name: 'name', label: '姓名', required: true, defaultValue: current?.name },
      { name: 'title', label: '职务', defaultValue: current?.title ?? undefined },
      {
        name: 'departmentId',
        label: '部门',
        type: 'select',
        required: true,
        defaultValue: current?.departmentId ?? selected[0],
        options: org().departments.map((d) => ({ value: d.id, label: d.name })),
      },
      {
        name: 'managerId',
        label: '直属上级',
        type: 'select',
        defaultValue: current?.managerId ?? undefined,
        options: center.people().filter((p) => p.value !== current?.id),
      },
      {
        name: 'roles',
        label: '角色',
        type: 'select',
        multiple: true,
        defaultValue: current?.roles ?? [],
        options: org().roles.map((r) => ({ value: r.id, label: r.name })),
      },
      {
        name: 'active',
        label: '状态',
        type: 'select',
        required: true,
        defaultValue: current?.active === false ? 'no' : 'yes',
        options: [
          { value: 'yes', label: '在职' },
          { value: 'no', label: '离职' },
        ],
      },
    ];
    const answers = await prompt({
      title: current ? `编辑员工：${current.name}` : '新员工',
      fields,
      confirmText: '保存',
    });
    if (!answers) return;
    const values = answers as Record<string, string | string[]>;
    const text = (name: string) => String(values[name] ?? '').trim();
    await save('已保存员工', () =>
      center.editOrg('saveEmployee', {
        id: current?.id ?? text('id'),
        name: text('name'),
        title: text('title') || null,
        departmentId: text('departmentId'),
        managerId: text('managerId') || null,
        roles: [...((values['roles'] as string[] | undefined) ?? [])],
        active: values['active'] !== 'no',
      }),
    );
  }

  const columns: DataTableColumn<EmployeeRow>[] = [
    { key: 'name', header: '姓名', width: 110 },
    { key: 'title', header: '职务', minWidth: 120 },
    {
      key: 'departmentId',
      header: '部门',
      width: 110,
      cell: (e) => departmentName(e.departmentId),
    },
    {
      key: 'managerId',
      header: '直属上级',
      width: 110,
      cell: (e) => (e.managerId ? who(e.managerId) : '—'),
    },
    { key: 'roles', header: '角色', minWidth: 140, cell: (e) => roleNames(e.roles).join('、') },
    {
      key: 'active',
      header: '状态',
      width: 80,
      cell: (e) =>
        e.active ? <Badge tone="success">在职</Badge> : <Badge tone="neutral">离职</Badge>,
    },
  ];

  return () => {
    const current = org();
    const department = current.departments.find((d) => d.id === selected[0]);
    const shown = department ? subtree(current, department.id) : undefined;
    const employees = current.employees.filter((e) => !shown || shown.has(e.departmentId));
    return (
      <div {...css.attrs(styles.layout)}>
        <Card
          padding="md"
          header="部门"
          extra={
            <Button
              size="sm"
              variant="ghost"
              tone="neutral"
              icon={Plus}
              onClick={() => void editDepartment()}
            >
              新部门
            </Button>
          }
        >
          <Flex direction="column" gap="sm">
            <Tree
              items={treeOf(current, null)}
              getKey={(node) => node.department.id}
              getLabel={(node) => node.department.name}
              getChildren={(node) => (node.children.length > 0 ? node.children : undefined)}
              getIcon={() => Building2}
              _expanded={expanded}
              selectionMode="single"
              _selected={selected}
              aria-label="部门"
              sx={styles.tree}
            />
            {department && (
              <Flex gap="xs">
                <Button
                  size="sm"
                  variant="outline"
                  tone="neutral"
                  icon={Pencil}
                  onClick={() => void editDepartment(department)}
                >
                  编辑
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  tone="danger"
                  icon={Trash2}
                  onClick={() => void removeDepartment(department)}
                >
                  删除
                </Button>
              </Flex>
            )}
          </Flex>
        </Card>
        <Card
          padding="md"
          header={department ? `${department.name}（含下级部门）` : '全部员工'}
          extra={
            <Button size="sm" icon={Plus} onClick={() => void editEmployee()}>
              新员工
            </Button>
          }
        >
          <DataTable
            aria-label="员工"
            rows={employees}
            columns={columns}
            getKey={(e) => e.id}
            density="compact"
            onRowClick={(e) => void editEmployee(e)}
          />
        </Card>
      </div>
    );
  };
});
