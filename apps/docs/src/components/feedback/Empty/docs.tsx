import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/EmptyProps';
import resultApi from 'virtual:api/ResultProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { Examples } from '../../../site/Examples';
import Empties from './demo/Empties.tsx?demo';
import Results from './demo/Results.tsx?demo';

export const meta = {
  title: 'Empty 空状态与结果',
  description:
    '没有内容时的说明（Empty）与操作完成后的整块反馈（Result）：图标、标题、说明、操作居中排列。',
  order: 3,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { Empty, Result } from '@vue-tsx-pro/ui';">
    <Examples>
      <Example id="empty" title="空状态" demo={Empties}>
        列表、表格、搜索结果没有内容时用 <Code>Empty</Code>：说清楚为什么空、接下来能做什么；
        <Code>size</Code> 跟字号档位缩放，下拉选项里用 sm。
      </Example>
      <Example id="result" title="结果" demo={Results}>
        <Code>Result</Code> 是提交、支付这类操作后的整块反馈：<Code>status</Code>{' '}
        决定图标与颜色，图标挂载时一笔画出（<Code>draw</Code>），减少动态效果时直接显示。
      </Example>
    </Examples>
    <ApiReference api={[api, resultApi]} />
  </DocPage>
));
