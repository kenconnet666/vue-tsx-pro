// 供应商评价：三项打分（可半星），综合分只读显示
import { _component } from '@vue-tsx-pro/tsx';
import { Card, Field, Flex, Grid, Rating, Small, Text } from '@vue-tsx-pro/ui';

const aspects = [
  { key: 'quality', label: '质量', hint: '来料合格率、返工次数' },
  { key: 'delivery', label: '交期', hint: '准时交付、紧急插单的响应' },
  { key: 'service', label: '服务', hint: '沟通、售后、资料齐全' },
] as const;

type Aspect = (typeof aspects)[number]['key'];

export default _component(() => {
  let scores = _state<Record<Aspect, number | null>>({ quality: 4.5, delivery: 3, service: null });
  const average = () => {
    const given = Object.values(scores).filter((score): score is number => score != null);
    return given.length
      ? Math.round((given.reduce((a, b) => a + b, 0) / given.length) * 2) / 2
      : null;
  };
  return () => (
    <Card>
      <Flex direction="column" gap="md">
        <Text weight="semibold">杭州远山精密机械 · 2026 年第三季度评价</Text>
        <Grid minItemWidth="13rem" gap="md">
          {aspects.map((aspect) => (
            <Field key={aspect.key} label={aspect.label} description={aspect.hint}>
              <Rating
                value={scores[aspect.key]}
                {...{
                  'onUpdate:value': (next: number | null) =>
                    (scores = { ...scores, [aspect.key]: next }),
                }}
                allowHalf
              />
            </Field>
          ))}
        </Grid>
        <Flex align="center" gap="sm">
          <Small tone="muted">综合</Small>
          <Rating value={average()} readonly allowHalf size="sm" />
          <Small tone="muted">{average() ?? '还没打分'}</Small>
        </Flex>
      </Flex>
    </Card>
  );
});
