// 自己画出错时的内容；resetKeys 变了（换了要看的供应商）就自动恢复
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Alert,
  Button,
  Descriptions,
  ErrorBoundary,
  Flex,
  ToggleGroup,
  ToggleItem,
} from '@zerodep-dev/vue-tsx-pro-ui';

const suppliers: Record<string, { name: string; grade: string; contact: string } | null> = {
  hc: { name: '华辰精密机械有限公司', grade: 'A 级', contact: '林小满 · 138 0013 8000' },
  qh: { name: '青禾线缆', grade: 'B 级', contact: '周一航 · 139 0022 1100' },
  // 档案缺失：渲染时读不到字段
  ys: null,
};

const Profile = _component(({ id }: { id: string }) => () => {
  const supplier = suppliers[id]!;
  return (
    <Descriptions
      columns={1}
      items={[
        { label: '供应商', value: supplier.name },
        { label: '等级', value: supplier.grade },
        { label: '联系人', value: supplier.contact },
      ]}
    />
  );
});

export default _component(() => {
  let id = _state('ys');
  return () => (
    <Flex direction="column" gap="md">
      <ToggleGroup _value={id} required size="sm" aria-label="供应商">
        <ToggleItem value="hc">华辰精密</ToggleItem>
        <ToggleItem value="qh">青禾线缆</ToggleItem>
        <ToggleItem value="ys">远山钣金（档案缺失）</ToggleItem>
      </ToggleGroup>
      <ErrorBoundary
        resetKeys={[id]}
        fallback={(error, retry) => (
          <Alert
            tone="warning"
            title="供应商档案没能显示"
            action={
              <Button size="sm" variant="ghost" tone="neutral" onClick={retry}>
                重试
              </Button>
            }
          >
            {error.message}。换一家供应商会自动恢复。
          </Alert>
        )}
      >
        <Profile id={id} />
      </ErrorBoundary>
    </Flex>
  );
});
