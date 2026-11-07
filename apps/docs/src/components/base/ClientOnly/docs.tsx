import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/ClientOnlyProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import LocalTime from './demo/LocalTime.tsx?demo';

export const meta = {
  title: 'ClientOnly 只在浏览器里渲染',
  description:
    '服务端渲染与水合时画占位，挂载后才画内容：给依赖此刻、本机设置或要先量尺寸的内容用，免得服务端与浏览器的结果对不上。',
  order: 30,
};

export default _component(() => () => (
  <DocPage meta={meta} imports="import { ClientOnly } from '@zerodep-dev/vue-tsx-pro-ui';">
    <Example id="local-time" title="本机的时间与时区" demo={LocalTime}>
      服务端渲染时不知道访客的时区、语言和此刻，画出来的与浏览器的不一样，水合时会对不上。包在{' '}
      <Code>ClientOnly</Code> 里：服务端与水合时画 <Code>fallback</Code>
      {
        '（默认什么都不画，这里是骨架），挂载后才画 children。canvas、按量出来的尺寸排版也一样。没有服务端渲染的应用里，它只是晚一拍画出内容。'
      }
    </Example>
    <ApiReference api={api} />
  </DocPage>
));
