import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/ErrorBoundaryProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import Dashboard from './demo/Dashboard.tsx?demo';
import Fallback from './demo/Fallback.tsx?demo';

export const meta = {
  title: 'ErrorBoundary 错误边界',
  description:
    '一块内容出错时只把这一块换成出错提示，页面的其余部分照常：看板上的图表、详情页的某个面板、第三方组件。可以重试，换了数据后自动恢复。',
  order: 5,
};

export default _component(() => () => (
  <DocPage meta={meta} imports="import { ErrorBoundary } from '@zerodep-dev/vue-tsx-pro-ui';">
    <Example id="dashboard" title="工作台的一块出错" demo={Dashboard}>
      里面的组件在 setup、渲染、事件处理、侦听器里抛出的错误都被接住，不再往上传。
      {
        '默认显示 Result（危险色调、错误信息与重试按钮），重试时里面的组件整个重新创建（出错时的状态不可信）。'
      }
      <Code>onError</Code> 拿到错误与出错位置，交给日志服务。
      {'定时器、Promise 里的错误不经过 Vue，接不住，要在那里自己处理。'}
    </Example>
    <Example id="fallback" title="自己画出错时的内容，换了数据自动恢复" demo={Fallback}>
      <Code>fallback</Code> 拿到错误与重试函数，画成更贴近场景的提示；<Code>resetKeys</Code>{' '}
      里的值（路由参数、数据源）变了就清掉错误、重新创建里面的组件，不用用户点重试。
    </Example>
    <ApiReference api={api} />
  </DocPage>
));
