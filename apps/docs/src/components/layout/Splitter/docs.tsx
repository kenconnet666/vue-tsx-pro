import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/SplitterProps';
import { DocPage } from '../../../site/DocPage';
import { ApiReference } from '../../../site/ApiReference';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import { KeyboardReference } from '../../../site/KeyboardReference';
import MasterDetail from './demo/MasterDetail.tsx?demo';
import Vertical from './demo/Vertical.tsx?demo';

export const meta = {
  title: 'Splitter 分栏',
  description:
    '两栏并排或上下，中间的分隔条拖动调比例，一侧可以收起：收件箱的列表与预览、主从视图、编辑与预览。',
  order: 7,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { Splitter } from '@zerodep-dev/vue-tsx-pro-ui';">
    <Examples>
      <ExampleColumn>
        <Example id="master-detail" title="主从视图" demo={MasterDetail}>
          <Code>start</Code>、<Code>end</Code> 是两栏的内容，<Code>size</Code>{' '}
          是起始一栏的百分比（双向绑定，交给 <Code>usePersistentState</Code> 记住）。
          <Code>collapsible</Code>{' '}
          让一侧可以收起：分隔条中间有小按钮，收起的一栏隐藏、另一栏占满；拖动或用键盘调比例时自动展开。两栏各自滚动，外层要给高度。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="vertical" title="上下排列" demo={Vertical}>
          <Code>orientation="vertical"</Code> 上下排，分隔条横着、用 ↑ / ↓；<Code>minSize</Code>、
          <Code>maxSize</Code> 限定比例的范围。
        </Example>
      </ExampleColumn>
    </Examples>
    <KeyboardReference
      keys={[
        ['← / →', '起始一栏变窄、变宽 5%（从右到左排版下镜像）'],
        ['↑ / ↓', '上下排列时：上栏变矮、变高 5%'],
        ['Home / End', '到最小、最大比例'],
        ['Enter', '收起或展开可收起的那一侧'],
      ]}
    />
    <ApiReference api={api} />
  </DocPage>
));
