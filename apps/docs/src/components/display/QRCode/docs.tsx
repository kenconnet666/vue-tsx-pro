import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/QRCodeProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Branded from './demo/Branded.tsx?demo';
import Login from './demo/Login.tsx?demo';
import Share from './demo/Share.tsx?demo';

export const meta = {
  title: 'QRCode 二维码',
  description:
    '把链接、口令画成二维码：自带编码器（不依赖第三方库），输出 SVG，中间可以放 logo，扫码登录有加载中、已过期、已扫描的状态。',
  order: 9,
};

export default _component(() => () => (
  <DocPage meta={meta} imports="import { QRCode } from '@zerodep-dev/vue-tsx-pro-ui';">
    <Example id="share" title="分享链接" demo={Share}>
      <Code>value</Code>
      {
        ' 按 UTF-8 编码（中文、链接都行），自动选最小的版本（21 × 21 到 177 × 177 个模块）与罚分最低的掩码。'
      }
      <Code>ecc</Code>
      {' 是纠错等级：越高能扛的污损越多，码也越密，默认 M。'}
      <Code>size</Code> 是边长（默认 10em），<Code>margin</Code>
      {' 是四周静区的模块数（默认 2）。画出来是一条 path 的 SVG，放大不糊；要自己处理时 '}
      <Code>encodeQr(文字, {'{ ecc }'})</Code> 拿到矩阵。
    </Example>
    <Examples>
      <ExampleColumn>
        <Example id="logo" title="中间放 logo 与换颜色" demo={Branded}>
          <Code>logo</Code>
          {
            ' 是图片地址或任意内容（Avatar、Icon），放在中间的底板上，此时纠错默认用 H（能恢复约 30%）；'
          }
          <Code>logoSize</Code>
          {
            ' 是占边长的比例，默认 0.22，太大会扫不出来。颜色默认跟主题：浅色主题下是 surface 底、文字色模块；深色主题下仍是白底深色模块，反色的码很多扫码器认不出。'
          }
          <Code>color</Code>、<Code>bgColor</Code> 可以改，保持深色模块配浅色底。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="status" title="扫码登录的状态" demo={Login}>
          <Code>status</Code>：<Code>loading</Code> 取票据时转圈，<Code>expired</Code>
          {' 盖上“二维码已过期”，给了 '}
          <Code>onRefresh</Code> 时有刷新按钮，<Code>scanned</Code>
          {
            ' 是手机已经扫到、等确认。状态层是 role="status"，换状态时读屏会念；二维码本身是带名称的图片（'
          }
          <Code>aria-label</Code>，默认“二维码”）。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={[api]} />
  </DocPage>
));
