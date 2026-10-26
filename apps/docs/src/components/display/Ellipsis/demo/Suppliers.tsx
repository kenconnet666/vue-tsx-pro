// 列表里的长名称：拖动滑块改宽度，真的截断了的名称才能悬停、聚焦看全文
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Badge, Card, Ellipsis, Field, Flex, Slider, Small } from '@zerodep-dev/vue-tsx-pro-ui';

const suppliers = [
  { name: '杭州远山精密机械有限公司（萧山二厂）', city: '杭州', grade: 'A' },
  { name: '宁波海川液压件有限公司', city: '宁波', grade: 'A' },
  { name: '苏州明德电子科技有限公司 · 华东区域服务中心', city: '苏州', grade: 'B' },
  { name: '无锡恒通', city: '无锡', grade: 'C' },
];

export default _component(() => {
  let width = _state(18);
  return () => (
    <Flex direction="column" gap="md">
      <Field label={`列表宽度：${width}rem`}>
        <Slider _value={width} min={10} max={30} />
      </Field>
      <Card padding="sm" style={{ width: `${width}rem`, maxWidth: '100%' }}>
        <Flex direction="column" gap="sm">
          {suppliers.map((supplier) => (
            <Flex key={supplier.name} align="center" gap="sm">
              <Badge size="xs" variant="soft" tone={supplier.grade === 'A' ? 'success' : 'neutral'}>
                {supplier.grade}
              </Badge>
              <Ellipsis>{supplier.name}</Ellipsis>
              <Small tone="muted" style={{ marginInlineStart: 'auto', flexShrink: 0 }}>
                {supplier.city}
              </Small>
            </Flex>
          ))}
        </Flex>
      </Card>
    </Flex>
  );
});
