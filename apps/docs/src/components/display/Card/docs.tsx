import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/CardProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Effects from './demo/Effects.tsx?demo';
import Extra from './demo/Extra.tsx?demo';
import Loading from './demo/Loading.tsx?demo';
import Sections from './demo/Sections.tsx?demo';
import Variants from './demo/Variants.tsx?demo';

export const meta = {
  title: 'Card 卡片',
  description:
    '把一组相关内容放在一块表面上：四种样式，可选的页头与页脚，正文加载中换成骨架，倾斜、聚光、流光三种装饰效果。',
  order: 0,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { Card } from '@zerodep-dev/vue-tsx-pro-ui';">
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
        <Example id="extra" title="页头的操作" demo={Extra}>
          <Code>extra</Code> 在页头的结束边（“全部 ↗”、标记、按钮），和 <Code>header</Code>{' '}
          排在一行、放不下时换行，不用自己在 header 里写两端对齐。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="loading" title="内边距与加载中" demo={Loading}>
          <Code>padding</Code> 取间距档位；<Code>loading</Code>{' '}
          时正文换成扫光的骨架（SkeletonText），
          <Code>propsSkeleton</Code> 改行数。
        </Example>
        <Example id="effects" title="装饰效果" demo={Effects}>
          <Code>effect</Code> 是纯 CSS 的装饰：<Code>tilt</Code> 跟着指针倾斜、带高光，
          <Code>spotlight</Code> 一团光跟着指针、靠近边框时点亮边框，<Code>beam</Code>{' '}
          一段光沿边框流动。光层对读屏隐藏、不接收指针；减少动态效果时不倾斜、流光不动。有效果时外面多一层定位用的
          div，未声明的属性落在它上面；<Code>propsEffect</Code> 落在光层上。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
