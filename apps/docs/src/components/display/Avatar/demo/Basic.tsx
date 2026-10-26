import { Building2 } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Avatar,
  Flex,
  Icon,
  Text,
  type StatusTone,
  type TextSize,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { members } from './photos';

const sizes: TextSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
const tones: StatusTone[] = ['accent', 'info', 'success', 'warning', 'danger', 'neutral'];

export default _component(() => () => (
  <Flex direction="column" gap="lg">
    <Flex align="center" gap="md" wrap>
      <Text size="xs" tone="muted">
        尺寸
      </Text>
      {sizes.map((size) => (
        <Avatar key={size} size={size} src={members[0]!.src} name={`林小满（${size}）`} />
      ))}
    </Flex>
    <Flex align="center" gap="md" wrap>
      <Text size="xs" tone="muted">
        后备内容
      </Text>
      <Avatar name="吴悠" />
      <Avatar name="Zhao Qing" />
      <Avatar name="陈默" src="/not-found.png" />
      <Avatar />
      <Avatar name="设计中心" radius="md" fallback={<Icon icon={Building2} />} />
    </Flex>
    <Flex align="center" gap="md" wrap>
      <Text size="xs" tone="muted">
        色调
      </Text>
      {tones.map((tone) => (
        <Avatar key={tone} name={tone} tone={tone} />
      ))}
      {tones.map((tone) => (
        <Avatar key={`solid-${tone}`} name={tone} tone={tone} variant="solid" />
      ))}
    </Flex>
  </Flex>
));
