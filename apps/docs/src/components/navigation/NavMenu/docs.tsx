import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/NavMenuProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Tree from './demo/Tree.tsx?demo';

export const meta = {
  title: 'NavMenu 菜单导航',
  description:
    '数据驱动的侧边导航：菜单是一棵树（后端按角色返回、或配置里写的），交给 NavMenu 渲染成小节、分组和链接。',
  order: 5.5,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { NavMenu } from '@zerodep-dev/vue-tsx-pro-ui';">
    <Examples>
      <ExampleColumn>
        <Example id="tree" title="菜单树" demo={Tree}>
          <Code>items</Code> 的字段同 <Code>NavBar</Code>{' '}
          的项（label、href、icon、badge、disabled、children），同一份菜单数据可以同时给顶部的
          NavBar 和侧栏的 NavMenu。有 <Code>children</Code>{' '}
          的项是一组：顶层的默认是带小标题、一直展开的小节，<Code>{'topLevel="group"'}</Code>{' '}
          改成可收起的分组；更深的层级都是分组，含当前页的组自动展开。没有 <Code>href</Code>{' '}
          又没有可显示子项的目录不画，后端返回的目录下没有该用户能看的页面时，目录自然消失。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
