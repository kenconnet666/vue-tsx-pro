import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/CardProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Loading from './demo/Loading.tsx?demo';
import Sections from './demo/Sections.tsx?demo';
import Variants from './demo/Variants.tsx?demo';

export const meta = {
  title: 'Card 卡片',
  description: '把一组相关内容放在一块表面上：四种样式，可选的页头与页脚，正文加载中换成骨架。',
  order: 0,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { Card } from '@vue-tsx-pro/ui';">
    <Examples>
      <ExampleColumn>
        <Example id="variants" title="样式" demo={Variants}>
          <Code>variant</Code> 有
          surface（默认）、outline、elevated、ghost，颜色与阴影都取主题；可以用{' '}
          <Code>defaults.Card</Code> 统一改。
        </Example>
        <Example id="sections" title="页头与页脚" demo={Sections}>
          <Code>header</Code>、<Code>footer</Code> 与正文之间有分隔线；需要语义容器时把标题放进
          header，或在外面包 article、section。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="loading" title="内边距与加载中" demo={Loading}>
          <Code>padding</Code> 取间距档位；<Code>loading</Code>{' '}
          时正文换成扫光的骨架（SkeletonText），
          <Code>propsSkeleton</Code> 改行数。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
