// 一次看三张：slidesPerView、gap；不循环，到头时那一侧的按钮不可用。窄屏时改成一次看一张半
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Card,
  Carousel,
  Flex,
  Image,
  Small,
  Text,
  useMediaQuery,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { drawings } from '../../Image/demo/drawings';

const prices = ['¥ 128.00', '¥ 46.50', '¥ 312.00', '¥ 18.90', '¥ 75.00', '¥ 240.00'];

export default _component(() => {
  const wide = useMediaQuery('(min-width: 40rem)');
  return () => (
    <Carousel
      items={drawings}
      getKey={(drawing) => drawing.code}
      slidesPerView={wide.value ? 3 : 1.5}
      gap="1em"
      loop={false}
      dots={false}
      aria-label="推荐零件"
    >
      {(drawing, index) => (
        <Card padding="sm">
          <Flex direction="column" gap="xs">
            <Image
              src={drawing.src}
              alt={drawing.title}
              width="100%"
              height="auto"
              propsRoot={{ style: { display: 'block', aspectRatio: '3 / 2' } }}
            />
            <Text weight="medium">{drawing.title}</Text>
            <Flex justify="between">
              <Small tone="muted">{drawing.code}</Small>
              <Small>{prices[index]}</Small>
            </Flex>
          </Flex>
        </Card>
      )}
    </Carousel>
  );
});
