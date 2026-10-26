// 零件批量导入：Excel 或 CSV。“下载模板”用 exportXlsx 生成带表头与示例行的 .xlsx（料号一列故意空着一行、数量写错一格）；
// 导入时按名称与别名对上列，zod 逐行校验，有错的格子就地改；导入的行显示在下面的清单里
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Card,
  Flex,
  readCsvFile,
  Small,
  Tag,
  type DataTableColumn,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { DataImport } from '@zerodep-dev/vue-tsx-pro-ui/patterns';
import { exportXlsx, readXlsx } from '@zerodep-dev/vue-tsx-pro-ui/xlsx';
import * as z from 'zod';

interface Part {
  part: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
}

const categories = ['机械件', '塑料件', '钣金件', '标准件', '线缆'];

const schema = z.object({
  part: z.string('请填写零件号').regex(/^P-\d{3,}$/, '零件号是 P- 加数字'),
  name: z.string('请填写名称').min(1, '请填写名称'),
  category: z.enum(categories, '品类只能是：' + categories.join('、')),
  quantity: z.coerce.number('数量要是数字').int('数量是整数').positive('数量要大于 0'),
  price: z.coerce.number('单价要是数字').nonnegative('单价不能为负'),
});

// 模板：表头与几行示例（故意留两处错，导入时能看到校验）
const sample: Record<string, string | number | null>[] = [
  { part: 'P-101', name: '显示器支架', category: '机械件', quantity: 40, price: 128 },
  { part: 'P-102', name: '铰链底座', category: '机械件', quantity: 80, price: 76.5 },
  { part: null, name: '检修口盖板', category: '钣金件', quantity: 24, price: 212 },
  { part: 'P-104', name: '线束卡箍', category: '线缆', quantity: '三百', price: 3.2 },
  { part: 'P-105', name: '加强筋', category: '塑料件', quantity: 60, price: 45 },
];
const templateColumns: DataTableColumn<Record<string, string | number | null>>[] = [
  { key: 'part', header: '料号', width: 120 },
  { key: 'name', header: '名称', width: 160 },
  { key: 'category', header: '品类', width: 100 },
  { key: 'quantity', header: '数量（件）', width: 100 },
  {
    key: 'price',
    header: '单价（元）',
    width: 100,
    type: 'number',
    format: { maximumFractionDigits: 2 },
  },
];

export default _component(() => {
  let imported = _state<Part[]>([]);

  return () => (
    <Flex direction="column" gap="md">
      <Card>
        <DataImport
          fields={[
            {
              key: 'part',
              label: '零件号',
              required: true,
              aliases: ['料号', 'Part No.'],
              width: 120,
            },
            { key: 'name', label: '名称', required: true, width: 160 },
            { key: 'category', label: '品类', required: true, width: 100 },
            { key: 'quantity', label: '数量', type: 'number', width: 100 },
            { key: 'price', label: '单价', type: 'number', width: 100 },
          ]}
          schema={schema}
          // .csv 用组件库自带的 readCsvFile，.xlsx 用 xlsx 子路径的 readXlsx
          parse={(file) =>
            file.name.toLowerCase().endsWith('.csv') ? readCsvFile(file) : readXlsx(file)
          }
          accept=".xlsx,.csv"
          onTemplate={() =>
            void exportXlsx('零件导入模板', [
              { name: '零件', rows: sample, columns: templateColumns },
            ])
          }
          onImport={async (rows) => {
            await new Promise((resolve) => setTimeout(resolve, 500));
            imported = [...imported, ...rows];
          }}
        />
      </Card>
      {imported.length > 0 && (
        <Flex gap="xs" wrap align="center">
          <Small tone="muted">已导入：</Small>
          {imported.map((part) => (
            <Tag key={part.part}>
              {part.part} {part.name} × {part.quantity}
            </Tag>
          ))}
        </Flex>
      )}
    </Flex>
  );
});
