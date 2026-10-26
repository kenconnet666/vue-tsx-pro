import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/ProseProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import Article from './demo/Article.tsx?demo';

export const meta = {
  title: 'Prose 长文',
  description:
    '文章、说明文档、帮助页的容器：段落、标题、列表、引用、代码块、表格依次排下来时的间距、行长与行高；List / OrderedList 是长文里的列表。',
  order: 3,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { List, ListItem, OrderedList, Prose } from '@zerodep-dev/vue-tsx-pro-ui';"
  >
    <Example id="article" title="一篇文章" demo={Article}>
      样式引擎不写“相邻元素之间”的选择器，块间距用 flex 的 <Code>gap</Code> 统一给（默认
      lg），本库的组件都不带外边距。
      <Code>measure</Code> 默认把行长限制在约 70 个字宽，放在窄栏里时关掉。List、OrderedList
      保留圆点与编号（FlexList 是去掉它们的布局列表）。
    </Example>
    <ApiReference api={api} />
  </DocPage>
));
