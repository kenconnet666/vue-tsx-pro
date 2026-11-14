// 自绘的控制条（controls="custom"）：跟主题走，播放 / 暂停、进度、音量、字幕、倍速、全屏；播放中鼠标不动几秒后收起
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Figure, Video } from '@zerodep-dev/vue-tsx-pro-ui';

export default _component(() => () => (
  <Figure caption="点画面播放 / 暂停；焦点在播放器里时可以用键盘操作">
    <Video
      sources={[
        { src: '/media/clip.webm', type: 'video/webm' },
        { src: '/media/clip.mp4', type: 'video/mp4' },
      ]}
      tracks={[
        { src: '/media/clip.zh.vtt', srclang: 'zh', label: '中文' },
        { src: '/media/clip.en.vtt', srclang: 'en', label: 'English' },
      ]}
      poster="/media/clip.jpg"
      controls="custom"
      aria-label="小球沿波浪线移动的动画"
      loop
    />
  </Figure>
));
