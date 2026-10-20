import { Circle, Eraser, Hand, MousePointer2, Pencil, Square, Type } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { Card, Flex, IconButton, Small, Toolbar, Tooltip, type IconData } from '@vue-tsx-pro/ui';

const tools: [string, string, IconData][] = [
  ['select', '选择', MousePointer2],
  ['hand', '平移', Hand],
  ['pencil', '画笔', Pencil],
  ['rect', '矩形', Square],
  ['ellipse', '椭圆', Circle],
  ['text', '文字', Type],
  ['eraser', '橡皮', Eraser],
];

const styles = stylex.create({
  canvas: {
    flexGrow: 1,
    minHeight: '16rem',
    borderRadius: '_md',
    backgroundColor: '_fill',
    backgroundImage:
      'linear-gradient(_colors.borderMuted 1px, transparent 1px), linear-gradient(90deg, _colors.borderMuted 1px, transparent 1px)',
    backgroundSize: '24px 24px',
  },
});

export default _component(() => {
  let tool = _state('pencil');
  return () => (
    <Flex gap="md">
      <Card padding="xs">
        <Toolbar orientation="vertical" aria-label="绘图工具">
          {tools.map(([value, label, icon]) => (
            <Tooltip
              key={value}
              placement="right"
              trigger={(props) => (
                <IconButton
                  {...props}
                  icon={icon}
                  aria-label={label}
                  aria-pressed={tool === value}
                  variant={tool === value ? 'soft' : 'ghost'}
                  tone={tool === value ? 'accent' : 'neutral'}
                  onClick={() => (tool = value)}
                />
              )}
            >
              {label}
            </Tooltip>
          ))}
        </Toolbar>
      </Card>
      <Flex direction="column" gap="xs" sx={styles.canvas}>
        <Small tone="muted">当前工具：{tools.find(([value]) => value === tool)![1]}</Small>
      </Flex>
    </Flex>
  );
});
