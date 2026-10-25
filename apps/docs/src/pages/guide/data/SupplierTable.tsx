// 服务端分页：查询栏的条件点“查询”才应用；翻页、改每页条数、点表头排序立即请求；换条件、排序、条数回到第一页。
// 筛选、排序、分页都在“服务端”（假接口）做，页面只管把条件交出去
import { _component } from '@vue-tsx-pro/tsx';
import {
  DataTable,
  Field,
  Flex,
  PaginationBar,
  tableParams,
  TextField,
  useHttp,
  useTableQuery,
  type DataTableColumn,
} from '@vue-tsx-pro/ui';
import { FilterBar } from '@vue-tsx-pro/ui/patterns';
import type { Supplier, SupplierPage } from './fake-api';

const columns: DataTableColumn<Supplier>[] = [
  { key: 'id', header: '编号', width: 80, sortable: true },
  { key: 'name', header: '名称', width: 220, sortable: true },
  { key: 'city', header: '城市', width: 80, sortable: true },
  { key: 'category', header: '类别', width: 100 },
];

export default _component(() => {
  const http = useHttp();
  let draft = _state({ keyword: '' });
  const suppliers = useTableQuery(
    (query, signal) =>
      http.request<SupplierPage>({ url: '/suppliers', query: tableParams(query, columns), signal }),
    { filters: { keyword: '' }, pageSize: 5 },
  );
  const reset = () => {
    draft = { keyword: '' };
    suppliers.search({ ...draft });
  };

  return () => (
    <Flex direction="column" gap="md">
      <FilterBar
        onSearch={() => suppliers.search({ ...draft })}
        onReset={reset}
        loading={suppliers.loading}
      >
        <Field label="关键字">
          <TextField _value={draft.keyword} placeholder="名称或城市" clearable />
        </Field>
      </FilterBar>
      <DataTable
        rows={suppliers.rows}
        columns={columns}
        getKey={(item) => item.id}
        _sort={suppliers.sort}
        manualSort
        loading={suppliers.loading}
        aria-label="供应商"
      />
      <PaginationBar
        _page={suppliers.page}
        _pageSize={suppliers.pageSize}
        total={suppliers.total}
        pageSizeOptions={[5, 10, 20]}
        showTotal={({ total }) => `共 ${total} 家`}
      />
    </Flex>
  );
});
