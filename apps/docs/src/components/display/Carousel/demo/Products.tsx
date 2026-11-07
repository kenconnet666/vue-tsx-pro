// 一次看两张半：slidesPerView、gap，露出下一张的一半提示还能滑；不循环，到头时那一侧的按钮不可用
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Card, Carousel, Flex, Image, Small, Text } from '@zerodep-dev/vue-tsx-pro-ui';
import { drawings } from '../../Image/demo/drawings';

const prices = ['¥ 128.00', '¥ 46.50', '¥ 312.00', '¥ 18.90', '¥ 75.00', '¥ 240.00'];

export default _component(() => () => (
  <Carousel
    items={drawings}
    getKey={(drawing) => drawing.code}
    slidesPerView={2.5}
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
));
