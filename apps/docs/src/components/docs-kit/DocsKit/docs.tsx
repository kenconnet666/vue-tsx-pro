import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code, Link } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/DocArticleProps';
import groupApi from 'virtual:api/CodeGroupProps';
import previewApi from 'virtual:api/CodePreviewProps';
import propsTableApi from 'virtual:api/PropsTableProps';
import sectionApi from 'virtual:api/DocSectionProps';
import swatchApi from 'virtual:api/ColorSwatchProps';
import tableApi from 'virtual:api/TextTableProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Article from './demo/Article.tsx?demo';
import Group from './demo/Group.tsx?demo';
import Handwritten from './demo/Handwritten.tsx?demo';
import Preview from './demo/Preview.tsx?demo';
import Swatches from './demo/Swatches.tsx?demo';

export const meta = {
  title: 'DocsKit 文档工具',
  description:
    '给自己的组件、类库写文档站：文章骨架（DocArticle、DocSection、TextTable）、示例卡片（CodePreview）、属性表（PropsTable）、按标签切换的一组代码（CodeGroup）、色块（ColorSwatch）。本站就是用它们搭的。',
  order: 1,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { CodeGroup, CodePreview, ColorSwatch, DocArticle, DocSection, PropsTable, TextTable } from '@zerodep-dev/vue-tsx-pro-ui/docs-kit';"
  >
    <Example id="article" title="一篇文档" demo={Article}>
      {'docs-kit 是单独的子路径：业务界面用不到，不放在主入口；文案自带中英文。'}
      正文比界面文字大一号、行距宽松；页面多宽由外面的 <Code>Container</Code> 决定。
      <Code>lead</Code> 放在简介下面，导入语句之类。<Code>DocSection</Code> 的 <Code>id</Code>{' '}
      是锚点，也进 <Code>TableOfContents</Code>。<Code>TextTable</Code>{' '}
      的表头和单元格都是文字，反引号里的是行内代码（<Code>CodeText</Code>
      ），第一列默认不折行；要排序、合并单元格用 <Code>ColumnTable</Code>、<Code>DataTable</Code>
      。代码块 <Link href="/components/code">CodeBlock</Link>、页内目录{' '}
      <Link href="/components/nav-list#toc">TableOfContents</Link>{' '}
      在主入口：帮助中心、文章页也用得上。
    </Example>
    <Examples>
      <ExampleColumn>
        <Example id="preview" title="示例卡片" demo={Preview}>
          <Code>CodePreview</Code>{' '}
          上面是运行中的效果、下面是源码（默认收起，可复制），本站的每个示例都是一张；示例里是自己文档站的一节。
          <Code>showCode</Code> 可以双向绑定源码的展开状态，<Code>actions</Code>{' '}
          往工具栏最前面加按钮。<Code>code</Code> 也可以是返回 Promise
          的函数：源码在指针移到工具栏上、或展开时才加载。
        </Example>
        <Example id="code-group" title="一组代码" demo={Group}>
          <Code>CodeGroup</Code> 用标签页切换几段代码，标签栏就是代码块的标题栏；几组绑同一个{' '}
          <Code>_value</Code> 就一起切换。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="color-swatch" title="色块" demo={Swatches}>
          <Code>ColorSwatch</Code> 列出一块颜色与它的名称、取值（调色板、设计 token）。
          <Code>color</Code> 是颜色值或主题 token：token
          的取值按当前主题读出，换主题时跟着变（右上角切换主题试试）。半透明的颜色下面垫棋盘格。
        </Example>
      </ExampleColumn>
    </Examples>
    <Example id="props-table" title="属性表" demo={Handwritten}>
      <Code>PropsTable</Code> 是组件 API 的表格，本站每页底部的 API 表就是它。数据类型是{' '}
      <Code>ApiProp</Code>
      ：名称、种类（属性、事件、内容、部件属性）、类型、必填、默认值、能否 <Code>_bind</Code>
      、说明，档位类的 <Code>values</Code>{' '}
      列出每个可选值的含义。必填、可绑定的标记文案取语言包；外层是静态表格，窄屏时横向滚动。本站的
      API 表从类型与 JSDoc 自动生成同样的数据。外观属性同 Table：<Code>density</Code> 默认 compact，
      <Code>variant</Code>、<Code>striped</Code> 照常可用。
    </Example>
    <ApiReference
      api={[api, sectionApi, tableApi, previewApi, groupApi, propsTableApi, swatchApi]}
    />
  </DocPage>
));
