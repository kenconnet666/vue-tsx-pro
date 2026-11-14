// 视频：原生控制条、定比例的外框、封面；两种格式，浏览器取第一个能播的
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Figure, Video } from '@zerodep-dev/vue-tsx-pro-ui';

export default _component(() => () => (
  <Figure caption="原生的控制条；宽高比 16 / 9，加载前就占好位置">
    <Video
      sources={[
        { src: '/media/clip.webm', type: 'video/webm' },
        { src: '/media/clip.mp4', type: 'video/mp4' },
      ]}
      poster="/media/clip.jpg"
      aria-label="小球沿波浪线移动的动画"
      loop
    />
  </Figure>
));
