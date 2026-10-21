// flipInRtl：从右到左排版（dir="rtl"）时水平翻转。箭头、chevron、“返回”这类有方向的图标要翻，时钟、勾号这类不翻
import { ArrowRight, Check, ChevronLeft, Clock } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Card, Flex, Grid, Icon, Small, Text } from '@vue-tsx-pro/ui';

const directions = [
  { dir: 'ltr', label: '从左到右（中文、英文）' },
  { dir: 'rtl', label: '从右到左（阿拉伯语、希伯来语）' },
] as const;

export default _component(() => () => (
  <Grid minItemWidth="14rem" gap="md">
    {directions.map((item) => (
      <Card key={item.dir} padding="sm" dir={item.dir}>
        <Flex direction="column" gap="sm">
          <Small tone="muted">{item.label}</Small>
          <Text>
            <Icon icon={ChevronLeft} flipInRtl /> 返回
          </Text>
          <Text>
            下一步 <Icon icon={ArrowRight} flipInRtl />
          </Text>
          <Text>
            <Icon icon={Clock} /> 3 分钟前 · <Icon icon={Check} /> 已读
          </Text>
        </Flex>
      </Card>
    ))}
  </Grid>
));
