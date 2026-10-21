import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/BadgeProps';
import tagApi from 'virtual:api/TagProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import InContext from './demo/InContext.tsx?demo';
import Matrix from './demo/Matrix.tsx?demo';
import Shapes from './demo/Shapes.tsx?demo';
import TagBasic from './demo/TagBasic.tsx?demo';
import TagRemovable from './demo/TagRemovable.tsx?demo';

export const meta = {
  title: 'Badge 标记',
  description:
    '状态、计数、分类等短文字（Badge），可以移除的标签（Tag）：四种样式 × 六种色调，可带图标。',
  order: 5,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { Badge, Tag } from '@vue-tsx-pro/ui';">
    <Examples>
      <ExampleColumn>
        <Example id="matrix" title="样式与色调" demo={Matrix}>
          <Code>variant</Code> 决定醒目程度：solid 实底最醒目，soft 浅底（默认），surface
          浅底加描边，outline 只有描边；<Code>tone</Code>{' '}
          是状态色调。每种组合在各主题下都满足对比度。
        </Example>
        <Example id="shapes" title="尺寸、形状与图标" demo={Shapes}>
          字号默认 xs，<Code>size</Code> 改档位；<Code>radius="full"</Code>{' '}
          是胶囊形，适合计数与在线状态；<Code>icon</Code> 放在文字前。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="in-context" title="表格里的状态" demo={InContext}>
          状态列用胶囊形的 soft 标记：颜色区分状态，文字说明状态，不只靠颜色。
        </Example>
        <Example id="tag" title="Tag 标签" demo={TagBasic}>
          <Code>Tag</Code> 的外观选项与 Badge 相同，<Code>defaults.Badge</Code>{' '}
          一起改两者的默认值；技能、分类、关键词这类成组出现的短文字用它。
        </Example>
        <Example id="tag-removable" title="可移除的标签" demo={TagRemovable}>
          写了 <Code>onRemove</Code> 就有移除按钮：先淡出，离场结束才调用 <Code>onRemove</Code>
          ；按钮的读屏名称是“移除 + 标签文字”，<Code>removeLabel</Code> 可以改。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={[api, tagApi]} />
  </DocPage>
));
