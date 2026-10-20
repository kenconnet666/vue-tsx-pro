import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { Card, Flex, FlexList, ScrollArea, Small, Strong } from '@vue-tsx-pro/ui';

const playlists = [
  ['通勤路上', 32, 210],
  ['深夜写代码', 48, 265],
  ['周末早午餐', 21, 30],
  ['跑步节拍', 40, 0],
  ['雨天爵士', 27, 230],
  ['专注白噪音', 12, 160],
  ['九十年代华语', 55, 340],
  ['电影原声', 36, 290],
] as const;

const styles = stylex.create({
  item: { flexShrink: 0, width: '9rem' },
  // 封面色由每张歌单的色相决定
  cover: (hue: number) => ({
    aspectRatio: '1',
    marginBlockEnd: '_sm',
    borderRadius: '_md',
    backgroundImage: `linear-gradient(135deg, oklch(70% 0.14 ${hue}), oklch(45% 0.12 ${hue + 40}))`,
  }),
  padded: { paddingBlockEnd: '_md' },
});

export default _component(() => () => (
  <ScrollArea axis="x" type="always" propsViewport={{ 'aria-label': '推荐歌单' }}>
    <FlexList gap="md" sx={styles.padded}>
      {playlists.map(([name, count, hue]) => (
        <li key={name} {...stylex.attrs(styles.item)}>
          <Card padding="sm">
            <div {...stylex.attrs(styles.cover(hue))} />
            <Flex direction="column">
              <Strong>{name}</Strong>
              <Small tone="muted">{count} 首</Small>
            </Flex>
          </Card>
        </li>
      ))}
    </FlexList>
  </ScrollArea>
));
