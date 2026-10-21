import { _component } from '@vue-tsx-pro/tsx';
import { Code, Kbd } from '@vue-tsx-pro/ui';
import api from 'virtual:api/SlideVerifyProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { KeyboardReference } from '../../../site/KeyboardReference';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Login from './demo/Login.tsx?demo';
import Puzzle from './demo/Puzzle.tsx?demo';

export const meta = {
  title: 'SlideVerify 拖动验证',
  description:
    '把滑块拖到头（或拖到拼图缺口）完成人机验证。组件只管交互，判定交给服务端：松手时交出位置与拖动轨迹。',
  order: 12,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { SlideVerify } from '@vue-tsx-pro/ui';">
    <Examples>
      <ExampleColumn>
        <Example id="slide" title="发送验证码前" demo={Login}>
          <Code>onRelease</Code>{' '}
          拿到松手位置、拖动轨迹（时间与位置序列）与用时，发给服务端校验——前端的滑块本身挡不住脚本。
          <Code>status</Code> 由应用控制：松手后设为 verifying，返回后设为 success 或 error，设回
          idle 时滑块回到起点。键盘用 <Kbd>←</Kbd> <Kbd>→</Kbd> 移动、<Kbd>Enter</Kbd> 松手，状态经
          aria-live
          播报；即便如此，这类验证对读屏与运动障碍用户仍不友好，应用应另外提供其他验证方式。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="puzzle" title="拼图" demo={Puzzle}>
          <Code>target="free"</Code> 时可以停在任意位置，<Code>position</Code> 双向绑定 0–1
          的位置，应用据此画出拼图块；图片与缺口位置也应由服务端生成。
        </Example>
      </ExampleColumn>
    </Examples>
    <KeyboardReference
      keys={[
        ['→ / ←', '移动滑块（从右到左排版时反过来）'],
        ['Home / End', '移到起点 / 终点'],
        ['Enter / Space', '松手提交这个位置（不能拖动时的替代操作，WCAG 2.5.7）'],
      ]}
    />
    <ApiReference api={api} />
  </DocPage>
));
