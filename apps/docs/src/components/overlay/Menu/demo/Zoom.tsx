import { ChevronDown, Maximize, ZoomIn, ZoomOut } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Button,
  Flex,
  Menu,
  MenuItem,
  Separator,
  Small,
  ToggleGroup,
  ToggleItem,
  type TextSize,
} from '@zerodep-dev/vue-tsx-pro-ui';

export default _component(() => {
  let zoom = _state(100);
  let size = _state<TextSize>('md');
  const step = (delta: number) => () => (zoom = Math.min(400, Math.max(25, zoom + delta)));
  return () => (
    <Flex direction="column" gap="md" align="start">
      <Flex gap="md" align="center" wrap>
        <ToggleGroup _value={size} required aria-label="菜单尺寸">
          <ToggleItem value="sm">sm</ToggleItem>
          <ToggleItem value="md">md</ToggleItem>
          <ToggleItem value="lg">lg</ToggleItem>
        </ToggleGroup>
        <Menu
          size={size}
          trigger={(props) => (
            <Button {...props} variant="outline" tone="neutral" iconEnd={ChevronDown}>
              缩放 {zoom}%
            </Button>
          )}
        >
          <MenuItem icon={ZoomIn} closeOnSelect={false} onAction={step(25)}>
            放大
          </MenuItem>
          <MenuItem icon={ZoomOut} closeOnSelect={false} onAction={step(-25)}>
            缩小
          </MenuItem>
          <Separator decorative={false} />
          <MenuItem icon={Maximize} onAction={() => (zoom = 100)}>
            实际大小
          </MenuItem>
        </Menu>
      </Flex>
      <Small tone="muted">放大、缩小执行后菜单不关，可以连着按；“实际大小”执行后关闭</Small>
    </Flex>
  );
});
