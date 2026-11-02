import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/DocArticleProps';
import sectionApi from 'virtual:api/DocSectionProps';
import tableApi from 'virtual:api/TextTableProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import Article from './demo/Article.tsx?demo';

export const meta = {
  title: 'DocArticle 文档页骨架',
  description:
    '写文档站的页面：DocArticle 是一篇文章（标题、简介、正文），DocSection 是带锚点的一节，TextTable 是说明用的文字表格。',
  order: 12.2,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { DocArticle, DocSection, TextTable } from '@zerodep-dev/vue-tsx-pro-ui/docs-kit';"
  >
    <Example id="article" title="一篇文档" demo={Article}>
      正文比界面文字大一号、行距宽松；页面多宽由外面的 <Code>Container</Code> 决定。
      <Code>lead</Code> 放在简介下面，导入语句之类。<Code>DocSection</Code> 的 <Code>id</Code>{' '}
      是锚点，也进 <Code>TableOfContents</Code>。<Code>TextTable</Code>{' '}
      的表头和单元格都是文字，反引号里的是行内代码（<Code>CodeText</Code>
      ），第一列默认不折行；要排序、合并单元格用 <Code>ColumnTable</Code>、<Code>DataTable</Code>。
    </Example>
    <ApiReference api={[api, sectionApi, tableApi]} />
  </DocPage>
));
