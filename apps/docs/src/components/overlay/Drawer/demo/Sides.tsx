// 四个方向与宽度档位：start / end 是逻辑方向（从右到左排版时左右互换），上下两侧的高度随内容
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Button,
  Drawer,
  Field,
  Flex,
  Paragraph,
  ToggleGroup,
  ToggleItem,
  type DrawerSides,
} from '@zerodep-dev/vue-tsx-pro-ui';

const sides = [
  ['start', ArrowRight, '起始边'],
  ['end', ArrowLeft, '结束边'],
  ['top', ArrowDown, '顶部'],
  ['bottom', ArrowUp, '底部'],
] as const;

type Size = 'xs' | 'sm' | 'md' | 'lg';
const sizes: Record<Size, string> = { xs: '30rem', sm: '40rem', md: '48rem', lg: '64rem' };

export default _component(() => {
  let side = _state<keyof DrawerSides>('end');
  let size = _state<Size>('xs');
  let open = _state(false);

  return () => (
    <Flex direction="column" gap="md">
      <Field label="宽度档位（左右两侧）">
        <ToggleGroup _value={size} required size="sm">
          {(Object.keys(sizes) as Size[]).map((key) => (
            <ToggleItem key={key} value={key}>
              {key} · {sizes[key]}
            </ToggleItem>
          ))}
        </ToggleGroup>
      </Field>
      <Flex gap="sm" wrap>
        {sides.map(([value, icon, label]) => (
          <Button
            key={value}
            variant="outline"
            tone="neutral"
            icon={icon}
            onClick={() => {
              side = value;
              open = true;
            }}
          >
            从{label}滑入
          </Button>
        ))}
      </Flex>
      <Drawer _open={open} side={side} size={size} title={`side="${side}" size="${size}"`}>
        <Paragraph>
          start / end 是逻辑方向：从右到左排版时左右互换。左右两侧按 size 的档位定宽（与 Container
          同档），靠正文的一边可以拖动调宽；顶部、底部的抽屉高度随内容，最多到视口高度。
        </Paragraph>
      </Drawer>
    </Flex>
  );
});
