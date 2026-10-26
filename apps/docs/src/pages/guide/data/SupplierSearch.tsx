// 供应商查询：关键字停下 300 ms 再请求，翻页立即请求；新请求取消上一次，晚到的旧结果不会覆盖；
// 重新请求时上一页的结果留着、变淡；出错时按错误码显示原因（useErrorMessage）与重试。http 由外层的 Provider 给出（应用里写在 createUi 里）
import { Search, TriangleAlert } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  Alert,
  Button,
  Flex,
  Pagination,
  Small,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TextField,
  useErrorMessage,
  useHttp,
  useRequest,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { watch } from 'vue';
import { failure, type SupplierPage } from './fake-api';

const PAGE_SIZE = 6;

const styles = css.create({
  search: { width: '16rem' },
  // 重新请求时旧结果留着、变淡，表格不闪成空的
  table: { transitionProperty: 'opacity', transitionDuration: '_md' },
  stale: { opacity: 0.55 },
});

export default _component(() => {
  const http = useHttp();
  let keyword = _state('');
  let page = _state(1);
  const describe = useErrorMessage();
  const suppliers = useRequest(
    ({ keyword, page }, signal) =>
      http.request<SupplierPage>({
        url: '/suppliers',
        query: { keyword, page, pageSize: PAGE_SIZE },
        signal,
      }),
    { params: () => ({ keyword: keyword.trim(), page }), debounce: 300 },
  );
  // 换了关键字从第一页看
  watch(
    () => keyword,
    () => (page = 1),
  );
  /** 翻页是点一下的变化，不用等防抖 */
  const turnTo = (next: number) => {
    page = next;
    void suppliers.refresh();
  };
  const failOnce = () => {
    failure.next = true;
    void suppliers.refresh();
  };

  return () => {
    const { data, error, loading } = suppliers;
    return (
      <Flex direction="column" gap="md">
        <Flex align="center" gap="md" wrap>
          <TextField
            _value={keyword}
            icon={Search}
            clearable
            placeholder="名称或城市，如“研发”“西安”"
            aria-label="查询供应商"
            sx={styles.search}
          />
          {loading && <Spinner size="sm" label="查询中" />}
          {data && <Small tone="muted">共 {data.total} 家</Small>}
          <Button size="sm" variant="ghost" tone="neutral" icon={TriangleAlert} onClick={failOnce}>
            模拟一次失败
          </Button>
        </Flex>
        {error != null && (
          <Alert
            tone="danger"
            title="查询失败"
            action={
              <Button size="sm" variant="outline" onClick={() => void suppliers.refresh()}>
                重试
              </Button>
            }
          >
            {describe(error)}
          </Alert>
        )}
        <Table sx={[styles.table, loading && styles.stale]} aria-busy={loading}>
          <TableHead>
            <TableRow>
              <TableHeaderCell>编号</TableHeaderCell>
              <TableHeaderCell>名称</TableHeaderCell>
              <TableHeaderCell>城市</TableHeaderCell>
              <TableHeaderCell>类别</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data?.rows ?? []).map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.id}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.city}</TableCell>
                <TableCell>{item.category}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {data && data.total > PAGE_SIZE && (
          <Pagination
            _page={page}
            onUpdate:_page={turnTo}
            total={data.total}
            pageSize={PAGE_SIZE}
          />
        )}
      </Flex>
    );
  };
});
