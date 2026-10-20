import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/TourProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import Onboarding from './demo/Onboarding.tsx?demo';

export const meta = {
  title: 'Tour 新手引导',
  description:
    '一步一步高亮页面上的元素并说明：遮罩镂空出目标，卡片贴着目标显示步数、上一步、下一步与跳过。',
  order: 5,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { Tour } from '@vue-tsx-pro/ui';">
    <Example id="onboarding" title="订单中心的引导" demo={Onboarding}>
      每一步的 <Code>target</Code>{' '}
      是选择器、元素或返回元素的函数（这里限定在示例里找）；没有目标的步骤卡片居中。
      切换步骤时目标滚到视口中间，滚动、缩放时镂空跟着动。<Code>open</Code>、<Code>current</Code>{' '}
      都可以双向绑定；点“完成”调用 <Code>onFinish</Code>，跳过或 Esc
      只关闭。模态：背景不可操作，焦点在卡片里循环。
    </Example>
    <ApiReference api={api} />
  </DocPage>
));
