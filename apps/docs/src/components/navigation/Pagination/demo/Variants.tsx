import { _component } from '@vue-tsx-pro/tsx';
import { Flex, Pagination, Small } from '@vue-tsx-pro/ui';

export default _component(() => {
  let compact = _state(6);
  let wide = _state(6);
  let small = _state(2);
  return () => (
    <Flex direction="column" gap="lg">
      <Flex direction="column" gap="xs">
        <Small tone="muted">默认：当前页两侧各 1 个，首尾各 1 个</Small>
        <Pagination aria-label="默认页码数" page={_bind(compact)} pageCount={20} />
      </Flex>
      <Flex direction="column" gap="xs">
        <Small tone="muted">
          siblings={'{2}'} boundaries={'{2}'}：页码多显示几个
        </Small>
        <Pagination
          aria-label="更多页码"
          page={_bind(wide)}
          pageCount={20}
          siblings={2}
          boundaries={2}
        />
      </Flex>
      <Flex direction="column" gap="xs">
        <Small tone="muted">size="sm"，页数少时不出现省略号</Small>
        <Pagination aria-label="小号分页" page={_bind(small)} pageCount={5} size="sm" />
      </Flex>
    </Flex>
  );
});
