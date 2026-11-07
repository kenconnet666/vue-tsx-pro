// 类型：表格、透视表、查询表格、列设置、导入从行的类型推出列与回调的参数；画布从节点推出渲染函数的参数；
// 主题切换的文字只认偏好里有的主题名。写错字段时类型检查报错
import * as z from 'zod';
import type { ThemePreference } from '../../config/theme/preference';
import { Diagram, type DiagramNodeItem } from '../../diagram/Diagram';
import { DataImport } from '../../patterns/DataImport';
import { QueryTable } from '../../patterns/QueryTable';
import { ThemeSwitcher } from '../../patterns/ThemeSwitcher';
import { ColumnSettings } from '../ColumnSettings';
import { ColumnTable } from '../ColumnTable';
import type { DataTableColumn } from '../columns';
import { PivotTable } from '../PivotTable';
import { TreeDataTable } from '../TreeDataTable';
import type { TablePage, TableQueryState } from '../use-table-query';

interface Quote {
  id: string;
  supplier: string;
  region: string;
  quarter: string;
  amount: number;
  children?: Quote[];
}
declare const quotes: Quote[];
const columns: DataTableColumn<Quote>[] = [
  { key: 'supplier', header: '供应商' },
  { key: 'amount', header: '金额', type: 'currency', value: (quote) => quote.amount },
];

export const columnTable = (
  <ColumnTable rows={quotes} columns={columns} getKey={(quote) => quote.id} aria-label="报价" />
);
export const columnTableTypo = (
  <ColumnTable
    rows={quotes}
    columns={columns}
    // @ts-expect-error 行是 Quote，没有 code
    getKey={(quote) => quote.code}
    aria-label="报价"
  />
);
export const treeTable = (
  <TreeDataTable
    rows={quotes}
    columns={columns}
    getKey={(quote) => quote.id}
    getChildren={(quote) => quote.children}
    aria-label="报价"
  />
);
export const pivot = (
  <PivotTable
    data={quotes}
    rows={[{ key: 'region', header: '区域' }]}
    columns={{ key: 'quarter', header: '季度' }}
    value={{ key: 'amount', header: '金额', value: (quote) => quote.amount }}
    aria-label="透视"
  />
);
export const pivotTypo = (
  <PivotTable
    data={quotes}
    rows={[{ key: 'region', header: '区域' }]}
    columns={{ key: 'quarter', header: '季度' }}
    // @ts-expect-error 行是 Quote，没有 total
    value={{ key: 'total', header: '合计', value: (quote) => quote.total }}
    aria-label="透视"
  />
);
export const settings = <ColumnSettings columns={columns} _hidden={['amount']} />;

declare const query: TableQueryState<TablePage<Quote>, { keyword: string }>;
export const queryTable = (
  <QueryTable
    query={query}
    columns={columns}
    getKey={(quote) => quote.id}
    title="报价台账"
    filters={(draft) => draft.keyword}
  />
);
export const queryTableTypo = (
  <QueryTable
    query={query}
    columns={columns}
    getKey={(quote) => quote.id}
    title="报价台账"
    // @ts-expect-error 查询条件只有 keyword
    filters={(draft) => draft.status}
  />
);

const partSchema = z.object({ part: z.string(), quantity: z.number() });
export const dataImport = (
  <DataImport
    fields={[
      { key: 'part', label: '零件号' },
      { key: 'quantity', label: '数量' },
    ]}
    schema={partSchema}
    onImport={(rows) => rows.map((row) => row.quantity * 2)}
  />
);
export const dataImportTypo = (
  <DataImport
    fields={[{ key: 'part', label: '零件号' }]}
    schema={partSchema}
    // @ts-expect-error 解析后的行没有 price
    onImport={(rows) => rows.map((row) => row.price)}
  />
);

interface Person extends DiagramNodeItem {
  name: string;
}
declare const people: Person[];
export const diagram = (
  <Diagram nodes={people} edges={[]} getNodeLabel={(person) => person.name} aria-label="组织">
    {(person) => person.name}
  </Diagram>
);
export const diagramTypo = (
  <Diagram
    nodes={people}
    edges={[]}
    // @ts-expect-error 节点是 Person，没有 title
    getNodeLabel={(person) => person.title}
    aria-label="组织"
  />
);

declare const preference: ThemePreference<'light' | 'dark' | 'paper'>;
export const switcher = <ThemeSwitcher preference={preference} labels={{ paper: '纸张' }} />;
export const switcherTypo = (
  // @ts-expect-error 偏好里没有 sepia 主题
  <ThemeSwitcher preference={preference} labels={{ sepia: '复古' }} />
);
