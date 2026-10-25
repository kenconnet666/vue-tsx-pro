// 主从视图：点一行在旁边看详情（activeKey 高亮正在看的那一行，带 aria-current）；编号是按钮，键盘也能打开
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
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
    code: 'PO-2026-0187',
    name: '办公椅供应商切换',
    node: '齐全性检查',
    due: '2026-10-23',
  },
  { id: 't2', code: 'PO-2026-0214', name: '卡箍改用铝合金', node: '方案设计', due: '2026-10-16' },
  {
    id: 't3',
    code: 'PO-2026-0233',
    name: '机柜导轨第二供应商',
    node: '财务复核',
    due: '2026-10-30',
  },
  { id: 't4', code: 'FA-2026-0142', name: '密封件国产化', node: '方案评审', due: TODAY },
];

const styles = css.create({
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
        _size={55}
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
            <div {...css.attrs(styles.empty)}>
              <Empty size="sm" title="选一条看详情" />
            </div>
          )
        }
      />
    );
  };
});
