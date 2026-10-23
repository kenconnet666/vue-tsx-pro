import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/PageHeaderProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import Detail from './demo/Detail.tsx?demo';
import List from './demo/List.tsx?demo';

export const meta = {
  title: 'PageHeader 页头',
  description:
    '后台每一页的第一块：面包屑、返回、标题与状态、说明、结束边的操作，下面放页签或筛选；宽屏时操作与标题同一行。',
  order: 2,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { PageHeader } from '@vue-tsx-pro/ui/patterns';">
    {/* 页头本来就占满一行：示例不分两列 */}
    <Example id="list" title="列表页" demo={List}>
      <Code>breadcrumbs</Code> 是面包屑的路径，<Code>meta</Code> 跟在标题后面（总数、状态），
      <Code>actions</Code> 在结束边，窗口窄了换到标题下面一行。children
      放在最下面：带计数的页签、筛选。
    </Example>
    <Example id="detail" title="详情页" demo={Detail}>
      <Code>back</Code>{' '}
      是地址时是返回链接（走路由适配），是函数时是按钮。长标题会换行，状态标记跟在后面；次要的操作收进“更多”菜单，结束边只留一两个主要操作。标题默认是
      h1（<Code>headingLevel</Code> 可改），字号比文章的 h1 小一档。
    </Example>
    <ApiReference api={api} />
  </DocPage>
));
