// 常用零件：容器多宽就放几列；图片是文档站共用的示例图纸
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { Card, Flex, GridList, Image, Small, Strong, Text } from '@zerodep-dev/vue-tsx-pro-ui';
import { drawings } from '../../../display/Image/demo/drawings';

const prices = [86, 128, 245, 12, 39, 64];
const parts = drawings.map((drawing, index) => ({ ...drawing, price: prices[index]! }));

const styles = css.create({
  cover: { display: 'block', marginBlockEnd: '_sm', aspectRatio: '3 / 2' },
});

export default _component(() => () => (
  <GridList minItemWidth="9rem" gap="md" aria-label="常用零件">
    {parts.map((part) => (
      <li key={part.code}>
        <Card padding="sm">
          <Image
            src={part.src}
            alt=""
            width="100%"
            height="auto"
            fit="contain"
            propsRoot={{ sx: styles.cover }}
          />
          <Flex direction="column" gap="xs">
            <Text size="sm">{part.title}</Text>
            <Strong>
              ¥{part.price} <Small tone="muted">/ 件</Small>
            </Strong>
          </Flex>
        </Card>
      </li>
    ))}
  </GridList>
));
