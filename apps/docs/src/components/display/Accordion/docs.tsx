import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/AccordionProps';
import itemApi from 'virtual:api/AccordionItemProps';
import collapseApi from 'virtual:api/CollapseProps';
import collapsibleApi from 'virtual:api/CollapsibleProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Disclosure from './demo/Disclosure.tsx?demo';
import Faq from './demo/Faq.tsx?demo';
import Settings from './demo/Settings.tsx?demo';

export const meta = {
  title: 'Accordion 手风琴',
  description:
    '一组可以展开收起的标题与内容（Accordion），单个的展开区域（Collapsible）与带高度过渡的内容区（Collapse）。',
  order: 2,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { Accordion, AccordionItem, Collapsible, Collapse } from '@vue-tsx-pro/ui';"
  >
    <Examples>
      <ExampleColumn>
        <Example id="faq" title="常见问题" demo={Faq}>
          默认一次只展开一项，再点可以收起（<Code>collapsible</Code>）；标题是 heading 里的按钮，↑ ↓
          在标题之间移动，Home / End 到两端。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="multiple" title="多开" demo={Settings}>
          <Code>selectionMode="multiple"</Code> 时每项独立展开，<Code>value</Code> 是数组；
          <Code>title</Code> 可以放图标、计数；<Code>headingLevel</Code> 按所在页面的大纲选。
        </Example>
        <Example id="collapsible" title="单个展开区域" demo={Disclosure}>
          <Code>Collapsible</Code> 是触发器加 <Code>Collapse</Code>：触发器用渲染函数，拿到
          aria-expanded、aria-controls 与点击，展开到任意按钮上。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={[api, itemApi, collapsibleApi, collapseApi]} />
  </DocPage>
));
