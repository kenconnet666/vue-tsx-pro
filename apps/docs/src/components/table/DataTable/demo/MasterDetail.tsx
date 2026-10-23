// 主从视图：点一行在旁边看详情（activeKey 高亮正在看的那一行，带 aria-current）；编号是按钮，键盘也能打开
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  Button,
  DataTable,
  Descriptions,
  Empty,
  Splitter,
  type DataTableColumn,
} from '@vue-tsx-pro/ui';
import { DeadlineBadge } from '@vue-tsx-pro/ui/patterns';

interface Todo {
  id: string;
  code: string;
  name: string;
  node: string;
  due: string;
}

const TODAY = '2026-10-21';
const todos: Todo[] = [
  {
    id: 't1',
    code: 'JY-2026-0187',
    name: '整流罩支架材料替代',
    node: '齐全性检查',
    due: '2026-10-23',
  },
  { id: 't2', code: 'DJ-2026-FC-14', name: '卡箍改用铝合金', node: '方案设计', due: '2026-10-16' },
  {
    id: 't3',
    code: 'DMC-2026-QY-3',
    name: '舱门铰链第二货源',
    node: '收益认定',
    due: '2026-10-30',
  },
  { id: 't4', code: 'FA-2026-0142', name: '密封件国产化', node: '方案评审', due: TODAY },
];

const styles = stylex.create({
  frame: {
    height: '18rem',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_border',
    borderRadius: '_md',
  },
  table: { height: '100%', maxHeight: 'none' },
  detail: { padding: '_md' },
  empty: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' },
});

export default _component(() => {
  let active = _state<string | null>('t2');
  const columns: DataTableColumn<Todo>[] = [
    {
      key: 'code',
      header: '编号',
      width: 140,
      cell: (row) => (
        <Button size="sm" variant="link" onClick={() => (active = row.id)}>
          {row.code}
        </Button>
      ),
    },
    { key: 'node', header: '环节', width: 110 },
    {
      key: 'due',
      header: '剩余',
      width: 140,
      cell: (row) => <DeadlineBadge due={row.due} today={TODAY} />,
    },
  ];
  return () => {
    const current = todos.find((row) => row.id === active);
    return (
      <Splitter
        sx={styles.frame}
        size={55}
        start={
          <DataTable
            aria-label="待办"
            rows={todos}
            columns={columns}
            getKey={(row) => row.id}
            activeKey={active}
            onRowClick={(row) => (active = row.id)}
            density="compact"
            propsRoot={{ sx: styles.table }}
          />
        }
        end={
          current ? (
            <Descriptions
              sx={styles.detail}
              size="sm"
              columns={1}
              items={[
                { label: '编号', value: current.code },
                { label: '名称', value: current.name },
                { label: '环节', value: current.node },
                { label: '截止', value: current.due },
              ]}
            />
          ) : (
            <div {...stylex.attrs(styles.empty)}>
              <Empty size="sm" title="选一条看详情" />
            </div>
          )
        }
      />
    );
  };
});
