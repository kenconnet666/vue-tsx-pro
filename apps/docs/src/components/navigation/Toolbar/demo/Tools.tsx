import { Circle, Eraser, Hand, MousePointer2, Pencil, Square, Type } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  Card,
  Flex,
  IconButton,
  Small,
  Toolbar,
  Tooltip,
  type IconData,
  t,
} from '@zerodep-dev/vue-tsx-pro-ui';

const tools: [string, string, IconData][] = [
  ['select', '选择', MousePointer2],
  ['hand', '平移', Hand],
  ['pencil', '画笔', Pencil],
  ['rect', '矩形', Square],
  ['ellipse', '椭圆', Circle],
  ['text', '文字', Type],
  ['eraser', '橡皮', Eraser],
];

const styles = css.create({
  canvas: {
    flexGrow: 1,
    minHeight: '16rem',
    padding: '_sm',
    borderRadius: '_md',
    backgroundColor: '_fill',
    backgroundImage: `linear-gradient(${t.colors.borderMuted} 1px, transparent 1px), linear-gradient(90deg, ${t.colors.borderMuted} 1px, transparent 1px)`,
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
