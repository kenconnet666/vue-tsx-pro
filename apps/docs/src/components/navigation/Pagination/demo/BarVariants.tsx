// 分页栏按自己的宽度取舍：窄时跳页先收起、总数换到单独一行；也可以自己写总数、只留其中几样
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { Card, Flex, PaginationBar, Small } from '@vue-tsx-pro/ui';

const styles = stylex.create({
  narrow: { maxWidth: '20rem' },
});

export default _component(() => {
  let narrow = _state(4);
  let custom = _state(1);
  let customSize = _state(20);
  let simple = _state(2);
  return () => (
    <Flex direction="column" gap="lg">
      <Flex direction="column" gap="xs">
        <Small tone="muted">放在 20rem 宽的卡片里：不显示跳页，总数单独一行</Small>
        <Card sx={styles.narrow}>
          <PaginationBar
            page={_bind(narrow)}
            total={86}
            showSizeSelect={false}
            propsPagination={{ 'aria-label': '窄分页', siblings: 0 }}
          />
        </Card>
      </Flex>
      <Flex direction="column" gap="xs">
        <Small tone="muted">showTotal 给函数：自己写总数</Small>
        <PaginationBar
          page={_bind(custom)}
          pageSize={_bind(customSize)}
          total={342}
          showTotal={({ from, to, total }) => `供应商 ${from}–${to} / ${total} 家 · 勾选跨页保留`}
          propsPagination={{ 'aria-label': '供应商分页' }}
        />
      </Flex>
      <Flex direction="column" gap="xs">
        <Small tone="muted">只要页码与总数：showSizeSelect、showJump 关掉</Small>
        <PaginationBar
          page={_bind(simple)}
          total={48}
          showSizeSelect={false}
          showJump={false}
          propsPagination={{ 'aria-label': '简单分页' }}
        />
      </Flex>
    </Flex>
  );
});
