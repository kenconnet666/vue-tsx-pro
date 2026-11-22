// 精灵表切图：一张 4 × 2 的像素画图集，每个精灵一个框。左边列表、右边图，点框或列表项选中；拖框挪、拖把手改大小、
// 拖红圈挪锚点（原点），都按整像素；工具条“按网格切”把整张切成 4 × 2，“整张”把图放进视口。改动按 phase 区分：
// 拖动中实时显示，松开（end）才记一次修改
import { Grid3x3, Maximize } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  Button,
  Card,
  createImageRegionsController,
  Flex,
  IconButton,
  ImageRegions,
  Listbox,
  Small,
  Toolbar,
  type ImageRegion,
} from '@zerodep-dev/vue-tsx-pro-ui';

const CELL = 16;
const COLORS = [
  '#e8a33d',
  '#5b9bd5',
  '#6fbf73',
  '#d9534f',
  '#9b59b6',
  '#f0c419',
  '#1abc9c',
  '#e67e22',
];
/** 一张 64 × 32 的像素画：每格一个圆点小人 */
const SHEET = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="32" shape-rendering="crispEdges">${COLORS.map(
    (color, i) => {
      const x = (i % 4) * CELL;
      const y = Math.floor(i / 4) * CELL;
      return `<rect x="${x + 4}" y="${y + 2}" width="8" height="8" fill="${color}"/><rect x="${x + 5}" y="${y + 10}" width="6" height="5" fill="${color}" opacity=".7"/>`;
    },
  ).join('')}</svg>`,
)}`;

const grid = (columns: number, rows: number): ImageRegion[] =>
  Array.from({ length: columns * rows }, (_, i) => {
    const x = (i % columns) * CELL;
    const y = Math.floor(i / columns) * CELL;
    return {
      id: `sprite-${i}`,
      label: `精灵 ${i + 1}`,
      x,
      y,
      width: CELL,
      height: CELL,
      anchor: { x: x + CELL / 2, y: y + CELL },
    };
  });

const styles = css.create({
  body: { height: '18rem' },
  list: { width: '9rem', flexShrink: 0, maxHeight: '100%' },
  regions: { flexGrow: 1, minWidth: 0 },
});

export default _component(() => {
  let regions = _state<ImageRegion[]>(grid(2, 1));
  let selected = _state<string | null>('sprite-0');
  let edits = _state(0);
  const view = createImageRegionsController();
  const current = () => regions.find((region) => region.id === selected);
  return () => (
    <Card padding="none" variant="outline">
      <Toolbar docked="top" aria-label="精灵表">
        <Button
          size="sm"
          variant="soft"
          tone="neutral"
          icon={Grid3x3}
          onClick={() => (regions = grid(4, 2))}
        >
          按网格切 4 × 2
        </Button>
        <IconButton
          size="sm"
          variant="ghost"
          icon={Maximize}
          aria-label="整张放进视口"
          onClick={() => view.fit()}
        />
        <Flex grow />
        <Small tone="muted" numeric>
          {current()
            ? `${current()!.x}, ${current()!.y}, ${current()!.width} × ${current()!.height}`
            : '没有选中'}{' '}
          · 改了 {edits} 次
        </Small>
      </Toolbar>
      <Flex sx={styles.body}>
        <Listbox
          items={regions}
          toOption={(region) => ({ value: region.id, label: region.label ?? region.id })}
          _value={selected}
          aria-label="精灵"
          sx={styles.list}
        />
        <ImageRegions
          src={SHEET}
          regions={regions}
          _selected={selected}
          anchors
          pixelated
          controller={view}
          onRegionChange={(next, { phase }) => {
            regions = regions.map((region) => (region.id === next.id ? next : region));
            if (phase === 'end') edits++;
          }}
          aria-label="精灵表"
          sx={styles.regions}
        />
      </Flex>
    </Card>
  );
});
