// 横向的虚拟列表（一千张照片也只渲染看得见的几张）；handle 拿到滚动方法，跳到指定的一张
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import {
  Button,
  Flex,
  NumberField,
  Small,
  VirtualList,
  type VirtualListHandle,
} from '@vue-tsx-pro/ui';

const photos = Array.from({ length: 1000 }, (_, index) => ({
  id: index,
  hue: (index * 37) % 360,
  title: `第 ${index + 1} 张`,
}));

const styles = css.create({
  list: { width: '_full', height: '8.5rem' },
  photo: {
    display: 'grid',
    placeItems: 'end start',
    boxSizing: 'border-box',
    width: '8rem',
    height: '8rem',
    marginInlineEnd: '_sm',
    padding: '_sm',
    borderRadius: '_md',
    color: 'white',
    fontSize: '_sm',
    fontWeight: '_semibold',
  },
});

const photoStyles = css.create({
  hue: (hue: number) => ({
    backgroundImage: `linear-gradient(135deg, hsl(${hue} 70% 55%), hsl(${(hue + 40) % 360} 70% 40%))`,
  }),
});

export default _component(() => {
  let list: VirtualListHandle | undefined;
  let target = _state<number | null>(500);
  return () => (
    <Flex direction="column" gap="md">
      <VirtualList
        items={photos}
        getKey={(photo) => photo.id}
        horizontal
        estimateSize={136}
        overscan={2}
        handle={(handle) => (list = handle)}
        aria-label="相册"
        sx={styles.list}
      >
        {(photo) => (
          <div {...css.attrs(styles.photo, photoStyles.hue(photo.hue))}>{photo.title}</div>
        )}
      </VirtualList>
      <Flex gap="sm" align="center" wrap>
        <NumberField value={_bind(target)} min={1} max={1000} aria-label="跳到第几张" size="sm" />
        <Button
          size="sm"
          variant="outline"
          tone="neutral"
          onClick={() => list?.scrollToIndex((target ?? 1) - 1, { align: 'start' })}
        >
          跳过去
        </Button>
        <Small tone="muted">只渲染看得见的几张，前后各多 2 张（overscan）</Small>
      </Flex>
    </Flex>
  );
});
