import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/BadgeProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { Examples } from '../../../site/Examples';
import InContext from './demo/InContext.tsx?demo';
import Matrix from './demo/Matrix.tsx?demo';
import Shapes from './demo/Shapes.tsx?demo';

export const meta = {
  title: 'Badge 标记',
  description: '状态、计数、分类等短文字：四种样式 × 六种色调，可带图标；只展示，不可交互。',
  order: 5,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { Badge } from '@vue-tsx-pro/ui';">
    <Examples>
      <Example id="matrix" title="样式与色调" demo={Matrix}>
        <Code>variant</Code> 决定醒目程度：solid 实底最醒目，soft 浅底（默认），surface
        浅底加描边，outline 只有描边；<Code>tone</Code> 是状态色调。每种组合在各主题下都满足对比度。
      </Example>
      <Example id="shapes" title="尺寸、形状与图标" demo={Shapes}>
        字号默认 xs，<Code>size</Code> 改档位；<Code>radius="full"</Code>{' '}
        是胶囊形，适合计数与在线状态；
        <Code>icon</Code> 放在文字前。可以关闭、选择的用 Tag。
      </Example>
      <Example id="in-context" title="表格里的状态" demo={InContext}>
        状态列用胶囊形的 soft 标记：颜色区分状态，文字说明状态，不只靠颜色。
      </Example>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
