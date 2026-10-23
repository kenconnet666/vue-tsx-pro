// 图标、颜色、数量与尺寸；不可用；只读的列表
import { Flame, Heart } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Field, Flex, Rating, Small } from '@vue-tsx-pro/ui';

const reviews = [
  { name: '林小满', score: 5, text: '交货快，包装很仔细' },
  { name: '周一航', score: 3.5, text: '质量可以，资料晚了两天' },
  { name: '许悠', score: 2, text: '第二批有划伤，已退换' },
];

export default _component(() => {
  let like = _state<number | null>(3);
  let urgency = _state<number | null>(2);
  return () => (
    <Flex direction="column" gap="lg">
      <Flex gap="lg" wrap>
        <Field label="喜欢程度" description='icon={Heart} tone="danger"'>
          <Rating value={_bind(like)} icon={Heart} tone="danger" />
        </Field>
        <Field label="紧急程度" description="count={3}，size=lg">
          <Rating value={_bind(urgency)} icon={Flame} tone="accent" count={3} size="lg" />
        </Field>
        <Field label="不可用" disabled>
          <Rating value={4} />
        </Field>
      </Flex>
      <Flex direction="column" gap="xs">
        {reviews.map((review) => (
          <Flex key={review.name} align="center" gap="sm">
            <Rating value={review.score} readonly allowHalf size="xs" />
            <Small>{review.name}</Small>
            <Small tone="muted">{review.text}</Small>
          </Flex>
        ))}
      </Flex>
    </Flex>
  );
});
