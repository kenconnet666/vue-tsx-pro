// 图片组：_index 双向绑定，下面一排缩略图点了跳过去，滑动大图时缩略图跟着高亮
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { ButtonBase, Carousel, Flex, Image, Small } from '@zerodep-dev/vue-tsx-pro-ui';
import { drawings } from '../../Image/demo/drawings';

const styles = css.create({
  thumb: {
    borderRadius: '_md',
    outlineWidth: '2px',
    outlineStyle: 'solid',
    outlineColor: 'transparent',
    outlineOffset: '2px',
    opacity: 0.6,
  },
  current: { outlineColor: '_accent', opacity: 1 },
});

export default _component(() => {
  let current = _state(0);
  return () => (
    <Flex direction="column" gap="sm">
      <Carousel
        items={drawings}
        getKey={(drawing) => drawing.code}
        _index={current}
        arrows
        dots={false}
        aria-label="图纸"
      >
        {(drawing) => (
          <Image
            src={drawing.src}
            alt={drawing.title}
            width="100%"
            height="auto"
            fit="contain"
            propsRoot={{ style: { display: 'block', aspectRatio: '3 / 2' } }}
          />
        )}
      </Carousel>
      <Flex gap="xs" wrap>
        {drawings.map((drawing, index) => (
          <ButtonBase
            key={drawing.code}
            sx={[styles.thumb, index === current && styles.current]}
            aria-label={drawing.title}
            aria-current={index === current ? 'true' : undefined}
            onClick={() => (current = index)}
          >
            <Image src={drawing.src} alt="" width={72} height={48} />
          </ButtonBase>
        ))}
      </Flex>
      <Small tone="muted">
        {drawings[current]!.title}（{current + 1} / {drawings.length}）
      </Small>
    </Flex>
  );
});
