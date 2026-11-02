// 数据修正：主要用来改数据的表写 editTrigger="click"，单击就进入编辑；diffRows 和原来的数据比，
// 改过的行着色（rowTone）、改过的格写出原值（ValueChange），删除的行留在最后，点“还原”回到原来的数据
import { RotateCcw, Trash2 } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Button,
  DataTable,
  diffRows,
  Flex,
  IconButton,
  Small,
  ValueChange,
  type DataTableColumn,
  type RowChanges,
  type RowDiff,
  type RowTone,
} from '@zerodep-dev/vue-tsx-pro-ui';

interface Supplier {
  id: string;
  name: string;
  city: string;
  rating: number;
}

const original: readonly Supplier[] = [
  { id: 'S-101', name: '华东精密', city: '苏州', rating: 92 },
  { id: 'S-102', name: '北辰机械', city: '天津', rating: 78 },
  { id: 'S-103', name: '南方电子', city: '深圳', rating: 85 },
  { id: 'S-104', name: '西部材料', city: '成都', rating: 70 },
];

const tones: Record<keyof RowChanges, RowTone> = {
  inserted: 'success',
  updated: 'warning',
  deleted: 'danger',
};

export default _component(() => {
  let suppliers = _state<Supplier[]>([...original]);
  const rows = _derived(diffRows(original, suppliers, (row) => row.id));
  const changed = _derived(rows.filter((row) => row.change).length);

  /** 一格：改过的写出原值 */
  function field<K extends 'name' | 'city' | 'rating'>(key: K, row: RowDiff<Supplier>) {
    return row.before && row.changedFields?.includes(key) ? (
      <ValueChange before={row.before[key]} after={row.row[key]} />
    ) : (
      row.row[key]
    );
  }

  const columns: DataTableColumn<RowDiff<Supplier>>[] = [
    { key: 'id', header: '编号', width: 110, value: (row) => row.row.id },
    {
      key: 'name',
      header: '供应商',
      value: (row) => row.row.name,
      cell: (row) => field('name', row),
      editable: (row) => row.change !== 'deleted',
      validate: (value) => (value ? null : '名称不能为空'),
    },
    {
      key: 'city',
      header: '城市',
      value: (row) => row.row.city,
      cell: (row) => field('city', row),
      editable: (row) => row.change !== 'deleted',
    },
    {
      key: 'rating',
      header: '评分',
      type: 'number',
      value: (row) => row.row.rating,
      cell: (row) => field('rating', row),
      editable: (row) => row.change !== 'deleted',
      validate: (value) =>
        typeof value === 'number' && value >= 0 && value <= 100 ? null : '评分是 0 到 100',
    },
    {
      key: 'remove',
      header: '操作',
      width: 72,
      cell: (row) =>
        row.change === 'deleted' ? null : (
          <IconButton
            size="sm"
            variant="ghost"
            icon={Trash2}
            aria-label={`删除 ${row.row.name}`}
            onClick={() => (suppliers = suppliers.filter((item) => item.id !== row.row.id))}
          />
        ),
    },
  ];

  return () => (
    <Flex direction="column" gap="sm">
      <Flex align="center" justify="between" gap="sm">
        <Small tone="muted">{changed > 0 ? `改动了 ${changed} 行` : '单击单元格修改'}</Small>
        <Button
          size="sm"
          variant="soft"
          icon={RotateCcw}
          disabled={changed === 0}
          onClick={() => (suppliers = [...original])}
        >
          还原
        </Button>
      </Flex>
      <DataTable
        aria-label="供应商"
        density="compact"
        editTrigger="click"
        rows={rows}
        columns={columns}
        getKey={(row) => row.key}
        rowTone={(row) => (row.change ? tones[row.change] : undefined)}
        onCellChange={(row, key, value) => {
          suppliers = suppliers.map((item) =>
            item.id === row.row.id ? { ...item, [key]: value } : item,
          );
        }}
      />
    </Flex>
  );
});
