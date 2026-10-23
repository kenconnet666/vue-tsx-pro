import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/FormSectionProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Admission from './demo/Admission.tsx?demo';
import Collapsible from './demo/Collapsible.tsx?demo';
import Review from './demo/Review.tsx?demo';

export const meta = {
  title: 'FormSection 表单分组',
  description:
    '长表单按主题分组：标题、说明、结束边的操作，下面是最多几列的字段栅格；可以收起，整组只读或不可用，带 id 时当锚点。',
  order: 2,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { FormSection } from '@vue-tsx-pro/ui';">
    <Examples>
      <ExampleColumn wide>
        <Example id="admission" title="长表单分组与目录" demo={Admission}>
          <Code>columns</Code> 是最多几列，每列不窄于 <Code>minColumnWidth</Code>
          ，容器窄时自动减少列数，不用断点；跨整行用 <Code>GridItem span="full"</Code>。给了{' '}
          <Code>id</Code> 就能当锚点：旁边放一个 TableOfContents
          做分节导航，跳过来时让开粘性顶栏。语义是以标题为名称的 group，标题是 h2–h6（
          <Code>headingLevel</Code>，默认 h3），读屏能按标题跳转。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="review" title="审批时整组只读" demo={Review}>
          分组也是一层字段布局：<Code>readonly</Code>、<Code>disabled</Code>、
          <Code>labelPlacement</Code>、<Code>labelWidth</Code> 写在分组上只作用于这一组，没写的沿用
          Form 的。申请内容只读，审批意见照常填。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="collapsible" title="可收起、标题栏的操作" demo={Collapsible}>
          <Code>collapsible</Code> 时标题是展开收起的按钮（aria-expanded），<Code>open</Code>{' '}
          可以绑定；收起的字段不能被 Tab 到。<Code>extra</Code>{' '}
          放在标题栏的结束边：添加一行、查看关联明细。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
