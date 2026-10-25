// 命令式抽屉：表格每一行的“编辑”直接 drawer.open(...)，页面里不放 Drawer、不管 open；
// 保存（onConfirm）后改回表格，await handle.closed 得到关上的原因，下面一行告诉用户刚才是保存还是放弃
import { Pencil } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import {
  DataTable,
  Field,
  Flex,
  IconButton,
  Small,
  TextField,
  useDrawer,
  type DataTableColumn,
} from '@vue-tsx-pro/ui';
import { reactive } from 'vue';

interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
}

const verdicts = { confirm: '已保存', escape: '按 Esc 放弃', outside: '点遮罩放弃' } as Record<
  string,
  string
>;

export default _component(() => {
  const drawer = useDrawer();
  let rows = _state<Supplier[]>([
    { id: 'S001', name: '华辰精密机加', contact: '林小满', phone: '021-5566 1001' },
    { id: 'S002', name: '启航复材', contact: '周一航', phone: '0512-6688 2002' },
    { id: 'S003', name: '远山钣金', contact: '陈默', phone: '029-8811 3003' },
  ]);
  let status = _state('');

  async function edit(row: Supplier) {
    // 这次编辑的草稿：保存时才写回表格
    const draft = reactive({ ...row });
    const handle = drawer.open({
      title: `编辑 ${row.name}`,
      description: `编号 ${row.id}`,
      size: 'xs',
      confirmText: '保存',
      onConfirm: async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        rows = rows.map((item) => (item.id === row.id ? { ...draft } : item));
      },
      content: () => (
        <Flex direction="column" gap="md">
          <Field label="名称" required>
            <TextField
              _value={draft.name}
            />
          </Field>
          <Field label="联系人">
            <TextField
              _value={draft.contact}
            />
          </Field>
          <Field label="电话">
            <TextField
              _value={draft.phone}
            />
          </Field>
        </Flex>
      ),
    });
    const reason = await handle.closed;
    status = `${row.name}：${verdicts[reason] ?? '放弃编辑'}`;
  }

  const columns: DataTableColumn<Supplier>[] = [
    { key: 'id', header: '编号', width: 80 },
    { key: 'name', header: '名称', width: 160 },
    { key: 'contact', header: '联系人', width: 100 },
    { key: 'phone', header: '电话', width: 140 },
    {
      key: 'actions',
      header: '操作',
      width: 64,
      cell: (row) => (
        <IconButton
          icon={Pencil}
          size="sm"
          variant="ghost"
          aria-label={`编辑 ${row.name}`}
          onClick={() => void edit(row)}
        />
      ),
    },
  ];

  return () => (
    <Flex direction="column" gap="sm">
      <DataTable rows={rows} columns={columns} getKey={(row) => row.id} aria-label="供应商" />
      <Small tone="muted" aria-live="polite">
        {status || '点“编辑”在抽屉里改一行'}
      </Small>
    </Flex>
  );
});
