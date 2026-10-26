import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/TourProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { KeyboardReference } from '../../../site/KeyboardReference';
import Onboarding from './demo/Onboarding.tsx?demo';

export const meta = {
  title: 'Tour 新手引导',
  description:
    '一步一步高亮页面上的元素并说明：遮罩镂空出目标，卡片贴着目标显示步数、上一步、下一步与跳过。',
  order: 6,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { Tour } from '@zerodep-dev/vue-tsx-pro-ui';">
    <Example id="onboarding" title="订单中心的引导" demo={Onboarding}>
      每一步的 <Code>target</Code>{' '}
      是选择器、元素或返回元素的函数（这里限定在示例里找）；没有目标的步骤卡片居中。切换步骤时目标滚到视口中间，滚动、缩放时镂空跟着动。
      <Code>_open</Code>、<Code>_current</Code> 都可以双向绑定；点“完成”调用 <Code>onFinish</Code>
      ，跳过或 Esc 只关闭。模态：背景不可操作，焦点在卡片里循环。每一步可以有 <Code>
        cover
      </Code>{' '}
      封面（插图、截图），贴着卡片顶边显示；<Code>propsNext</Code>{' '}
      可以把“下一步”设为不可用，等用户完成某个操作再继续。
    </Example>
    <KeyboardReference
      keys={[
        [
          '→ / ←',
          '下一步 / 上一步（从右到左排版时反过来）；焦点在输入框里时不处理，“下一步”不可用时不前进',
        ],
        ['Tab / Shift+Tab', '在卡片的按钮之间移动，焦点不会离开卡片'],
        ['Enter / Space', '按下聚焦的按钮'],
        ['Esc', '结束引导（不调用 onFinish），焦点回到打开前的位置'],
      ]}
    />
    <ApiReference api={api} />
  </DocPage>
));
