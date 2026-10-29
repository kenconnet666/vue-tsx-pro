// 图纸相册：ImageGroup 里的图共用一个预览，点哪张从哪张开始；大图里缩放（滚轮、+ −、双击）、拖动、旋转（R）、
// ← → 切换、下载；缩略图统一 4:3、圆角，名称在下面
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { Flex, Image, ImageGroup, Small } from '@zerodep-dev/vue-tsx-pro-ui';
import { drawings } from './drawings';

const styles = css.create({
  figure: { margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' },
});

export default _component(() => () => (
  <ImageGroup loop>
    {drawings.map((drawing) => (
      <figure key={drawing.code} {...css.attrs(styles.figure)}>
        <Image
          src={drawing.src}
          alt={`${drawing.title}（${drawing.code}）`}
          width={180}
          height={135}
          preview={{
            caption: `${drawing.code} · ${drawing.title}`,
            download: `${drawing.code}.svg`,
          }}
        />
        <Flex direction="column">
          <Small>{drawing.title}</Small>
          <Small tone="muted">{drawing.code}</Small>
        </Flex>
      </figure>
    ))}
  </ImageGroup>
));
