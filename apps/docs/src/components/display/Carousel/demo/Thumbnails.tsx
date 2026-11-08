// 图片组：_index 双向绑定，下面一排缩略图点了跳过去，滑动大图时缩略图跟着高亮
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { ButtonBase, Carousel, Flex, Image, Small } from '@zerodep-dev/vue-tsx-pro-ui';
import { drawings } from '../../Image/demo/drawings';

// 当前的一张（aria-current）描一圈强调色；其余的淡一些，悬停时亮起来。描边与焦点环共用 outline：键盘聚焦时换成焦点环的颜色
const styles = css.create({
  thumb: {
    borderRadius: '_md',
    outlineWidth: '2px',
    outlineStyle: 'solid',
    outlineColor: { default: 'transparent', _current: '_accent', _focusVisible: '_focusRing' },
    outlineOffset: '2px',
    opacity: { default: 0.6, _hover: 0.9, _current: { default: 1, _hover: 1 } },
  },
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
            sx={styles.thumb}
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
