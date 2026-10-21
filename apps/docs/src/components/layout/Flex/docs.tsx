import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import containerApi from 'virtual:api/ContainerProps';
import flexApi from 'virtual:api/FlexProps';
import gridItemApi from 'virtual:api/GridItemProps';
import gridApi from 'virtual:api/GridProps';
import separatorApi from 'virtual:api/SeparatorProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import AutoGrid from './demo/AutoGrid.tsx?demo';
import Containers from './demo/Containers.tsx?demo';
import Dashboard from './demo/Dashboard.tsx?demo';
import LabelledSeparators from './demo/LabelledSeparators.tsx?demo';
import Playground from './demo/Playground.tsx?demo';
import Separators from './demo/Separators.tsx?demo';
import Grow from './demo/Grow.tsx?demo';

export const meta = {
  title: 'Flex 弹性与网格布局',
  description:
    '一维的 Flex、二维的 Grid，加上列表语义的 FlexList / GridList、限宽居中的 Container 与分隔线 Separator：间距都取主题的五档。',
  order: 1,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { Container, Flex, FlexList, Grid, GridItem, GridList, Separator } from '@vue-tsx-pro/ui';"
  >
    <Examples>
      <ExampleColumn>
        <Example id="flex" title="Flex" demo={Playground}>
          不拆 Stack / Group：竖排写 <Code>direction="column"</Code>。<Code>gap</Code>{' '}
          取主题的间距档位（none、xs–xl），整站的疏密跟着主题一起变。
        </Example>
        <Example id="auto-grid" title="自动换列" demo={AutoGrid}>
          <Code>minItemWidth</Code>{' '}
          给每项的最小宽度，容器多宽就放几列，不需要断点；项目少于放得下的列数时各项拉宽占满（auto-fit）。这里用
          GridList：渲染为 ul，子元素用 li，读屏念“列表，6 项”。
        </Example>
        <Example id="labelled-separator" title="带文字的分隔线" demo={LabelledSeparators}>
          Separator 里写文字：默认居中，两边各一段线；<Code>labelAlign="start"</Code>{' '}
          文字在前、线在后，像一节的小标题。文字照常给读屏，两段线对读屏隐藏；
          <Code>decorative={'{false}'}</Code> 时整条是 role="separator"，以文字为名称。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="dashboard" title="固定列数与跨格" demo={Dashboard}>
          <Code>columns</Code> 固定等宽列；<Code>GridItem</Code> 的 <Code>span</Code>、
          <Code>rowSpan</Code> 跨几列、几行，<Code>span="full"</Code> 占满一整行（GridList 里用
          GridListItem）。<Code>flow="row dense"</Code> 回填前面留下的空位。
        </Example>
        <Example id="separator" title="分隔线与列表" demo={Separators}>
          Separator 默认是装饰性的、对读屏隐藏；分隔两组不同内容、需要读屏感知时写{' '}
          <Code>decorative={'{false}'}</Code>，渲染为 role="separator"。竖向的在 Flex
          里自动撑满行高。
        </Example>
        <Example id="container" title="Container" demo={Containers}>
          限制最大宽度并水平居中：xs 30rem（登录）、sm 40rem（表单、设置）、md 48rem（文章）、lg
          64rem（默认）、xl 80rem（仪表盘）。<Code>createContainer('main', 'Page')</Code>{' '}
          生成其他语义标签的容器。
        </Example>
        <Example id="grow" title="伸展、行内与行列间距" demo={Grow}>
          <Code>grow</Code> 让 Flex 在父级的 flex
          里占满剩余空间，并且可以收缩到比内容窄——头像旁边的长标题才能截断；
          <Code>inline</Code> 是行内的 flex，放在一段文字中间。Grid 的 <Code>rowGap</Code>、
          <Code>columnGap</Code> 分别覆盖 <Code>gap</Code>。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={[flexApi, gridApi, gridItemApi, containerApi, separatorApi]} />
  </DocPage>
));
