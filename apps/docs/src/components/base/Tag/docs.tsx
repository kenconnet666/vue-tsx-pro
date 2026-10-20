import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/TagProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { Examples } from '../../../site/Examples';
import Basic from './demo/Basic.tsx?demo';
import Removable from './demo/Removable.tsx?demo';

export const meta = {
  title: 'Tag 标签',
  description: '分类、筛选条件、关键词：外观同 Badge，可带图标与移除按钮，移除时淡出。',
  order: 6,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { Tag } from '@vue-tsx-pro/ui';">
    <Examples>
      <Example id="basic" title="基础用法" demo={Basic}>
        外观选项与 Badge 相同（<Code>variant</Code>、<Code>tone</Code>、<Code>size</Code>、
        <Code>radius</Code>），可以用 <Code>defaults.Badge</Code> 统一改默认值。
      </Example>
      <Example id="removable" title="可移除" demo={Removable}>
        写了 <Code>onRemove</Code> 就有移除按钮：先淡出，离场结束才调用 <Code>onRemove</Code>
        ；按钮的读屏名称是“移除 + 标签文字”，<Code>removeLabel</Code> 可以改。
      </Example>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
