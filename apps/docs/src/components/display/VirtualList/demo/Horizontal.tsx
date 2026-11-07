// 横向的虚拟列表（一千张图纸的缩略图也只渲染看得见的几张）；handle 拿到滚动方法，跳到指定的一张
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  Button,
  Flex,
  Image,
  NumberField,
  Small,
  VirtualList,
  type VirtualListHandle,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { drawings } from '../../Image/demo/drawings';

// 六张示例图纸轮着用
const photos = Array.from({ length: 1000 }, (_, index) => ({
  id: index,
  src: drawings[index % drawings.length]!.src,
  title: `第 ${index + 1} 张`,
}));

const styles = css.create({
  list: { width: '_full', height: '8.5rem' },
  photo: {
    position: 'relative',
    width: '8rem',
    height: '8rem',
    marginInlineEnd: '_sm',
  },
  // 序号压在图的左下角
  caption: {
    position: 'absolute',
    insetInlineStart: '_xs',
    insetBlockEnd: '_xs',
    paddingInline: '_xs',
    borderRadius: '_sm',
    backgroundColor: '_surface',
    fontSize: '_xs',
  },
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
          <div {...css.attrs(styles.photo)}>
            <Image src={photo.src} alt={photo.title} width="100%" height="100%" />
            <span {...css.attrs(styles.caption)} aria-hidden="true">
              {photo.title}
            </span>
          </div>
        )}
      </VirtualList>
      <Flex gap="sm" align="center" wrap>
        <NumberField _value={target} min={1} max={1000} aria-label="跳到第几张" size="sm" />
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
