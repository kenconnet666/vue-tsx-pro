// 定位到行：从通知、搜索结果跳过来时滚到那一行并闪一下。两千行里还没渲染的行也能滚到，
// 停在吸顶表头之下；找不到时 scrollToRow 返回 false
import { LocateFixed } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import {
  Button,
  createStatusMap,
  DataTable,
  Flex,
  Small,
  TextField,
  type DataTableColumn,
  type DataTableHandle,
} from '@vue-tsx-pro/ui';

const statuses = createStatusMap({
  doing: { label: '进行中', tone: 'info' },
  overdue: { label: '已超期', tone: 'danger' },
  done: { label: '已完成', tone: 'success' },
});

interface Task {
  code: string;
  name: string;
  owner: string;
  due: string;
  status: string;
}

const owners = ['张工', '李工', '王工', '赵工', '刘工'];
const parts = ['显示器', '支架', '纸箱', '线缆', '键盘', '鼠标'];

const tasks: Task[] = Array.from({ length: 2000 }, (_, index) => ({
  code: `PO-2026-${String(index + 1).padStart(4, '0')}`,
  name: `${parts[index % parts.length]}改进方案 ${index + 1}`,
  owner: owners[(index * 3) % owners.length]!,
  due: `2026-${String((index % 12) + 1).padStart(2, '0')}-${String((index % 28) + 1).padStart(2, '0')}`,
  status: index % 17 === 0 ? 'overdue' : index % 3 === 0 ? 'done' : 'doing',
}));

const columns: DataTableColumn<Task>[] = [
  { key: 'code', header: '任务编码', width: 136, sticky: 'start' },
  { key: 'name', header: '任务名称' },
  { key: 'owner', header: '责任人', width: 96 },
  { key: 'due', header: '截止日期', width: 120 },
  { key: 'status', header: '状态', width: 104, statuses },
];

const styles = css.create({ table: { maxHeight: '22rem' }, field: { width: '14rem' } });

export default _component(() => {
  let table: DataTableHandle | undefined;
  let code = _state('PO-2026-1360');
  let flashing = _state<string | null>(null);
  let missing = _state(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  function locate(key: string) {
    missing = !table?.scrollToRow(key, { align: 'center' });
    if (missing) return;
    // 滚到之后闪一下：浅色底停 1.5 秒
    flashing = key;
    clearTimeout(timer);
    timer = setTimeout(() => (flashing = null), 1500);
  }

  return () => (
    <Flex direction="column" gap="sm">
      <Flex align="center" gap="sm" wrap>
        <TextField
          _value={code}
          placeholder="任务编码"
          aria-label="任务编码"
          sx={styles.field}
          onKeydown={(event: KeyboardEvent) => event.key === 'Enter' && locate(code.trim())}
        />
        <Button size="sm" icon={LocateFixed} onClick={() => locate(code.trim())}>
          定位
        </Button>
        <Button size="sm" variant="ghost" onClick={() => locate(tasks[0]!.code)}>
          第一条
        </Button>
        <Button size="sm" variant="ghost" onClick={() => locate(tasks.at(-1)!.code)}>
          最后一条
        </Button>
        {missing && <Small tone="danger">没有这个任务</Small>}
      </Flex>
      <DataTable
        rows={tasks}
        columns={columns}
        getKey={(task) => task.code}
        rowTone={(task) => (task.code === flashing ? 'info' : undefined)}
        handle={(api) => (table = api)}
        density="compact"
        aria-label="销售任务"
        propsRoot={{ sx: styles.table }}
      />
    </Flex>
  );
});
