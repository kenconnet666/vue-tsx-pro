import { Bold, Italic, Underline } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import {
  Avatar,
  Button,
  Flex,
  formatHotkey,
  HoverCard,
  IconButton,
  Kbd,
  Link,
  Small,
  Strong,
  Switch,
  Tooltip,
  type IconData,
} from '@vue-tsx-pro/ui';

const marks: [IconData, string, string][] = [
  [Bold, '加粗', 'Mod+B'],
  [Italic, '斜体', 'Mod+I'],
  [Underline, '下划线', 'Mod+U'],
];

export default _component(() => {
  let hints = _state(true);
  return () => (
    <Flex direction="column" gap="lg" align="start">
      <Flex gap="md" align="center" wrap>
        <Flex gap="xs">
          {marks.map(([icon, label, hotkey]) => (
            <Tooltip
              key={label}
              delay={0}
              disabled={!hints}
              trigger={(props) => (
                <IconButton
                  {...props}
                  icon={icon}
                  aria-label={label}
                  variant="ghost"
                  tone="neutral"
                />
              )}
            >
              {label} <Kbd>{formatHotkey(hotkey)}</Kbd>
            </Tooltip>
          ))}
        </Flex>
        <Switch checked={_bind(hints)}>显示按钮提示</Switch>
      </Flex>
      <Flex gap="lg" align="center" wrap>
        <Tooltip
          delay={1000}
          trigger={(props) => (
            <Button {...props} variant="outline" tone="neutral">
              停一秒才提示
            </Button>
          )}
        >
          不常用的说明可以等久一点，免得指针划过时到处弹出
        </Tooltip>
        <Small tone="muted">
          作者{' '}
          <HoverCard
            delay={200}
            closeDelay={600}
            offset={12}
            trigger={(props) => (
              <Link {...props} href="/components/avatar">
                @周一航
              </Link>
            )}
          >
            <Flex gap="sm" align="center">
              <Avatar name="周一航" />
              <Flex direction="column">
                <Strong>周一航</Strong>
                <Small tone="muted">设计中心 · 高级交互设计师</Small>
              </Flex>
            </Flex>
          </HoverCard>{' '}
          发布于 3 天前
        </Small>
      </Flex>
    </Flex>
  );
});
