import { _component } from '@vue-tsx-pro/tsx';
import { Flex, PageJump, PageSizeSelect, Pagination, Small } from '@vue-tsx-pro/ui';

const total = 1286;

export default _component(() => {
  let page = _state(1);
  let size = _state(20);
  return () => {
    const pageCount = Math.ceil(total / size);
    const first = (page - 1) * size + 1;
    return (
      <Flex direction="column" gap="md">
        <Flex align="center" gap="md" wrap>
          <Pagination
            aria-label="订单分页"
            _page={_bind(page)}
            total={total}
            pageSize={size}
            showTotal
          />
          <PageSizeSelect _value={_bind(size)} onSizeChange={() => (page = 1)} />
          <PageJump _page={_bind(page)} pageCount={pageCount} />
        </Flex>
        <Small tone="muted">
          第 {first}–{Math.min(first + size - 1, total)} 条，共 {total.toLocaleString()} 条
        </Small>
      </Flex>
    );
  };
});
