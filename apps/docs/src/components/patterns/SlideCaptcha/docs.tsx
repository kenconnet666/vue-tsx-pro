import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/SlideCaptchaProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Basic from './demo/Basic.tsx?demo';

export const meta = {
  title: 'SlideCaptcha 滑块验证',
  description:
    '登录前的拼图滑块验证：服务端出题，拖动滑块让拼图对准缺口，松手把位置和拖动轨迹交给服务端判定。',
  order: 10,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { SlideCaptcha } from '@zerodep-dev/vue-tsx-pro-ui/patterns';"
  >
    <Examples>
      <ExampleColumn>
        <Example id="basic" title="服务端出题、服务端判定" demo={Basic}>
          组件只负责交互，不判对错：<Code>challenge</Code>{' '}
          是服务端给的图（背景带缺口、拼图块和背景一样高，左边缘就是缺口的左边缘），松手时{' '}
          <Code>onRelease</Code> 交出 <Code>{'{ x, track, duration }'}</Code>{' '}
          ，服务端按位置和轨迹（真人有加减速和抖动）判定，再由父级设置 <Code>status</Code>{' '}
          {
            '：verifying 时不能拖，success 锁定，error 时滑块晃一下，设回 idle 或换新图后回到起点。聚焦滑块后 ←/→ 微调、Home/End、Enter 松手；这类验证对读屏和运动障碍的用户不友好，应用应当另外提供别的方式。这个示例在浏览器里自己出题、自己判，只为演示。'
          }
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
