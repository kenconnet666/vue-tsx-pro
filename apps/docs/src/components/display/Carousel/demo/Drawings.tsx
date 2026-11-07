// 图纸轮播：每 5 秒换一张，指针停在上面或焦点进来时暂停，底部的按钮可以停下；滑动、拖动触摸板也能换
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Carousel, Image } from '@zerodep-dev/vue-tsx-pro-ui';
import { drawings } from '../../Image/demo/drawings';

export default _component(() => () => (
  <Carousel items={drawings} getKey={(drawing) => drawing.code} autoplay aria-label="零件图纸">
    {(drawing) => (
      <Image
        src={drawing.src}
        alt={`${drawing.title}（${drawing.code}）`}
        width="100%"
        height="auto"
        fit="contain"
        propsRoot={{ style: { display: 'block', aspectRatio: '3 / 2' } }}
      />
    )}
  </Carousel>
));
