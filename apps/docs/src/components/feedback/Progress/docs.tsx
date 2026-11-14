import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code, CodeBlock, Link } from '@zerodep-dev/vue-tsx-pro-ui';
import loadingBarApi from 'virtual:api/LoadingBarProps';
import overlayApi from 'virtual:api/LoadingOverlayProps';
import api from 'virtual:api/ProgressProps';
import spinnerApi from 'virtual:api/SpinnerProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Bars from './demo/Bars.tsx?demo';
import LoadingBar from './demo/LoadingBar.tsx?demo';
import Overlay from './demo/Overlay.tsx?demo';
import Rings from './demo/Rings.tsx?demo';
import Shapes from './demo/Shapes.tsx?demo';
import Spinners from './demo/Spinners.tsx?demo';

export const meta = {
  title: 'Progress 进度与加载',
  description:
    '进度条（Progress）、加载中的旋转指示（Spinner）、盖住一块区域的加载遮罩（LoadingOverlay）与窗口顶部的加载条（LoadingBar）；内容还没来时的占位用 Skeleton。',
  order: 2,
};

const routerCode = `// loading-bar.ts：应用里创建一次，组件内外都能调用
export const loadingBar = createLoadingBar();

// main.ts：换页时自动 start / finish，跳转失败时 error
useRouteLoadingBar(router, loadingBar);

// App.tsx：放一个
<LoadingBar controller={loadingBar} />`;

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports={
      "import { Progress, Spinner, LoadingOverlay, LoadingBar, createLoadingBar } from '@zerodep-dev/vue-tsx-pro-ui';\nimport { useRouteLoadingBar } from '@zerodep-dev/vue-tsx-pro-ui/vue-router';"
    }
  >
    <Examples>
      <ExampleColumn>
        <Example id="progress" title="进度条" demo={Bars}>
          <Code>value</Code> 与 <Code>max</Code>（默认 100）算完成比例，超出时夹住；
          <Code>tone</Code> 表示状态。<Code>label</Code>{' '}
          显示在上方，同时是进度条的名称；右侧默认是按语言格式化的百分比，
          <Code>valueLabel</Code> 换成自己的文字（只是显示），读屏念的用 <Code>valueText</Code> 改，
          <Code>showValueLabel={'{false}'}</Code> 不显示。值也可以是 bigint、Decimal。
          <Code>bands</Code>{' '}
          是量表的用法（磁盘占用、配额、评分这类量出来的数）：值落在哪一段就用哪一段的色调，角色换成{' '}
          <Code>role="meter"</Code>；仪表盘样子的量表用 Gauge。
        </Example>
        <Example id="rings" title="环形与目标" demo={Rings}>
          <Code>shape="circle"</Code> 是环形：中间显示数值，<Code>label</Code> 在下方，直径随{' '}
          <Code>size</Code> 缩放，适合仪表盘与卡片里的完成率；不写 <Code>value</Code>{' '}
          时一段弧一直转。
          <Code>target</Code> 是目标值：条上画一条竖线、环上画一道刻度，读屏念成“60%，目标
          80%”。分段的占比（各部门、各状态）用{' '}
          <Link href="/components/sparkline#proportion-bar">ProportionBar</Link>。
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
        <Example id="shapes" title="粗细与不确定进度" demo={Shapes}>
          <Code>size</Code> 跟字号档位缩放粗细，<Code>radius</Code> 改圆角；不写 <Code>value</Code>{' '}
          是不确定进度，循环滑动，减少动态效果时停下。
        </Example>
        <Example id="loading-bar" title="换页时的加载条" demo={LoadingBar}>
          <Code>LoadingBar</Code> 是窗口顶部的一条细线，控制器加显示（同 Toast）：
          <Code>createLoadingBar()</Code> 返回控制器，<Code>start</Code> 开始、<Code>finish</Code>{' '}
          走满后淡出、<Code>error</Code> 变成危险色走满。不知道真实进度，所以先快后慢地涨，停在 90%
          前等完成；<Code>delay</Code>
          （默认 200ms）之内就完成的不显示。它只是视觉提示：读屏读到的是内容区域的{' '}
          <Code>aria-busy</Code>。示例把加载条放进了框里，平时它贴在窗口顶部；接上路由见下面的代码。
        </Example>
      </ExampleColumn>
    </Examples>
    <CodeBlock code={routerCode} lang="tsx" title="加载条接上路由（本文档站就是这样接的）" />
    <ApiReference api={[api, spinnerApi, overlayApi, loadingBarApi]} />
  </DocPage>
));
