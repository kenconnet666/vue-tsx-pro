import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import overlayApi from 'virtual:api/LoadingOverlayProps';
import api from 'virtual:api/ProgressProps';
import spinnerApi from 'virtual:api/SpinnerProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Bars from './demo/Bars.tsx?demo';
import Overlay from './demo/Overlay.tsx?demo';
import Shapes from './demo/Shapes.tsx?demo';
import Spinners from './demo/Spinners.tsx?demo';

export const meta = {
  title: 'Progress 进度与加载',
  description:
    '进度条（Progress）、加载中的旋转指示（Spinner）与盖住一块区域的加载遮罩（LoadingOverlay）；内容还没来时的占位用 Skeleton。',
  order: 1,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { Progress, Spinner, LoadingOverlay } from '@vue-tsx-pro/ui';"
  >
    <Examples>
      <ExampleColumn>
        <Example id="progress" title="进度条" demo={Bars}>
          <Code>value</Code> 与 <Code>max</Code>（默认 100）算完成比例，超出时夹住；
          <Code>tone</Code> 表示状态。<Code>label</Code>{' '}
          显示在上方，同时是进度条的名称；右侧默认是按语言格式化的百分比，
          <Code>valueLabel</Code> 换成自己的文字（只是显示），读屏念的用 <Code>valueText</Code> 改，
          <Code>showValueLabel={'{false}'}</Code> 不显示。值也可以是 bigint、Decimal。
        </Example>
        <Example id="shapes" title="粗细与不确定进度" demo={Shapes}>
          <Code>size</Code> 跟字号档位缩放粗细，<Code>radius</Code> 改圆角；不写 <Code>value</Code>{' '}
          是不确定进度，循环滑动，减少动态效果时停下。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="spinner" title="旋转指示" demo={Spinners}>
          <Code>Spinner</Code> 默认跟随所在文字的大小与颜色，旁边有文字时是装饰；单独出现时写{' '}
          <Code>label</Code>（role="status"）。按钮的加载用 Button 的 <Code>loading</Code>。
        </Example>
        <Example id="overlay" title="加载遮罩" demo={Overlay}>
          <Code>LoadingOverlay</Code> 盖住一块区域，内容保留在下面，外层带
          aria-busy；很快完成时不出现，出现后至少显示一会儿，淡入淡出。<Code>blur</Code>{' '}
          模糊下面的内容。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={[api, spinnerApi, overlayApi]} />
  </DocPage>
));
