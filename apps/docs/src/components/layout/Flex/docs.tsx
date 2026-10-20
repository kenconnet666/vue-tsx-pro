import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import containerApi from 'virtual:api/ContainerProps';
import flexApi from 'virtual:api/FlexProps';
import gridApi from 'virtual:api/GridProps';
import separatorApi from 'virtual:api/SeparatorProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { Examples } from '../../../site/Examples';
import AutoGrid from './demo/AutoGrid.tsx?demo';
import Containers from './demo/Containers.tsx?demo';
import Dashboard from './demo/Dashboard.tsx?demo';
import Playground from './demo/Playground.tsx?demo';
import Separators from './demo/Separators.tsx?demo';

export const meta = {
  title: 'Flex 与 Grid',
  description:
    '一维的 Flex、二维的 Grid，加上列表语义的 FlexList / GridList、限宽居中的 Container 与分隔线 Separator：间距都取主题的五档。',
  order: 1,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { Container, Flex, FlexList, Grid, GridList, Separator } from '@vue-tsx-pro/ui';"
  >
    <Examples>
      <Example id="flex" title="Flex" demo={Playground}>
        不拆 Stack / Group：竖排写 <Code>direction="column"</Code>。<Code>gap</Code>{' '}
        取主题的间距档位（none、xs–xl），整站的疏密跟着主题一起变。
      </Example>
      <Example id="auto-grid" title="自动换列" demo={AutoGrid}>
        <Code>minItemWidth</Code>{' '}
        给每项的最小宽度，容器多宽就放几列，不需要断点；项目少于放得下的列数时各项拉宽占满（auto-fit）。
        这里用 GridList：渲染为 ul，子元素用 li，读屏念“列表，6 项”。
      </Example>
      <Example id="dashboard" title="固定列数与跨格" demo={Dashboard}>
        <Code>columns</Code> 固定等宽列；跨几列、几行用 <Code>sx</Code> 写 gridColumn / gridRow。
        <Code>flow="row dense"</Code> 回填前面留下的空位。
      </Example>
      <Example id="separator" title="分隔线与列表" demo={Separators}>
        Separator 默认是装饰性的、对读屏隐藏；分隔两组不同内容、需要读屏感知时写{' '}
        <Code>decorative={'{false}'}</Code>，渲染为 role="separator"。竖向的在 Flex 里自动撑满行高。
      </Example>
      <Example id="container" title="Container" demo={Containers}>
        限制最大宽度并水平居中：xs 30rem（登录）、sm 40rem（表单、设置）、md 48rem（文章）、lg
        64rem（默认）、xl 80rem（仪表盘）。<Code>createContainer('main', 'Page')</Code>{' '}
        生成其他语义标签的容器。
      </Example>
    </Examples>
    <ApiReference api={[flexApi, gridApi, containerApi, separatorApi]} />
  </DocPage>
));
