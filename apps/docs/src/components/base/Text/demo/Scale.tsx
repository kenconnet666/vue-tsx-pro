import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { Flex, Grid, Text, type FontWeight, type TextSize } from '@vue-tsx-pro/ui';

const sizes: TextSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
const weights: FontWeight[] = ['light', 'normal', 'medium', 'semibold', 'bold'];

// 左边一列是档位名：固定宽度，右边的样例对齐
const styles = css.create({ name: { width: '5em', flexShrink: 0 } });

export default _component(() => () => (
  <Grid minItemWidth="18em" gap="xl">
    <Flex direction="column" gap="sm">
      {sizes.map((size) => (
        <Flex key={size} align="baseline" gap="md">
          <Text size="xs" tone="muted" sx={styles.name}>
            size={size}
          </Text>
          <Text size={size}>界面里的文字 Typography</Text>
        </Flex>
      ))}
    </Flex>
    <Flex direction="column" gap="sm">
      {weights.map((weight) => (
        <Flex key={weight} align="baseline" gap="md">
          <Text size="xs" tone="muted" sx={styles.name}>
            {weight}
          </Text>
          <Text weight={weight} size="lg">
            季度营收 ¥1,280,000
          </Text>
        </Flex>
      ))}
    </Flex>
  </Grid>
));
