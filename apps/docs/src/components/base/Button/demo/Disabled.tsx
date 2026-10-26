import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Button, Flex, Tooltip } from '@zerodep-dev/vue-tsx-pro-ui';

const variants = ['solid', 'soft', 'surface', 'outline', 'ghost', 'link'] as const;

export default _component(() => () => (
  <Flex direction="column" gap="md">
    <Flex gap="sm" wrap align="center">
      {variants.map((variant) => (
        <Button key={variant} variant={variant} disabled>
          {variant}
        </Button>
      ))}
    </Flex>
    <Flex gap="sm" wrap align="center">
      <Tooltip
        trigger={(props) => (
          <Button {...props} disabled focusableWhenDisabled>
            提交
          </Button>
        )}
      >
        填完必填项后才能提交
      </Tooltip>
      <Tooltip
        trigger={(props) => (
          <Button {...props} variant="soft" tone="danger" disabled focusableWhenDisabled>
            注销账号
          </Button>
        )}
      >
        还有未结清的订单
      </Tooltip>
    </Flex>
  </Flex>
));
