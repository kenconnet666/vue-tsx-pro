import { CircleAlert, CircleCheck, CircleUser, Info, Sparkles, TriangleAlert } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Flex, Grid, Icon, Text, type IconData, type IconProps } from '@zerodep-dev/vue-tsx-pro-ui';

const tones: [IconProps['tone'], IconData, string][] = [
  ['neutral', CircleUser, '中性：正文色'],
  ['muted', CircleUser, '次要'],
  ['accent', Sparkles, '品牌色'],
  ['info', Info, '信息'],
  ['success', CircleCheck, '成功'],
  ['warning', TriangleAlert, '警告'],
  ['danger', CircleAlert, '危险'],
];

export default _component(() => () => (
  <Grid minItemWidth="9rem" gap="md">
    {tones.map(([tone, icon, label]) => (
      <Flex key={tone} gap="sm" align="center">
        <Icon icon={icon} tone={tone} size="xl" />
        <Text size="sm">{label}</Text>
      </Flex>
    ))}
  </Grid>
));
