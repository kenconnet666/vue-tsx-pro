import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code, Flex, H2, Paragraph } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/IconProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { ExampleColumn, Examples } from '../../../site/Examples';
import { Example } from '../../../site/Example';
import Basic from './demo/Basic.tsx?demo';
import Custom from './demo/Custom.tsx?demo';
import Direction from './demo/Direction.tsx?demo';
import Draw from './demo/Draw.tsx?demo';
import Labelled from './demo/Labelled.tsx?demo';
import Sizes from './demo/Sizes.tsx?demo';
import Tones from './demo/Tones.tsx?demo';
import WithText from './demo/WithText.tsx?demo';
import { IconLibrary } from './IconLibrary';

export const meta = {
  title: 'Icon 图标',
  description: '渲染 Lucide 格式的图标数据：按名导入、可摇树，也能画自己的图标。',
  order: 2,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports={
      "import { Icon } from '@zerodep-dev/vue-tsx-pro-ui';\nimport { Search } from '@lucide/icons';"
    }
  >
    <Examples>
      <ExampleColumn>
        <Example id="basic" title="基础用法" demo={Basic}>
          从 <Code>@lucide/icons</Code> 按名导入图标数据交给 <Code>icon</Code>
          ；只打包用到的图标。全部图标见页面下方的图标库。
        </Example>
        <Example id="sizes" title="尺寸与线宽" demo={Sizes}>
          不写 <Code>size</Code> 时是 1em，跟随所在文字；档位对应主题字号，数字是像素。
          <Code>strokeWidth</Code> 调线宽，大图标用细一点的线更精致。
        </Example>
        <Example id="tones" title="色调" demo={Tones}>
          不写 <Code>tone</Code> 时跟随文字颜色；状态图标用 <Code>success</Code>、
          <Code>warning</Code>、<Code>danger</Code> 等色调，和提示条、标记的颜色一致。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="with-text" title="与文字、按钮搭配" demo={WithText}>
          图标与文字基线对齐，不撑高行距；按钮、标记、链接里的图标由组件排好间距。
        </Example>
        <Example id="direction" title="从右到左" demo={Direction}>
          <Code>flipInRtl</Code> 让图标在从右到左的排版里水平翻转（按所在元素的 <Code>dir</Code>{' '}
          判断）：箭头、chevron、“返回”这类有方向的图标要翻，时钟、勾号不翻。
        </Example>
        <Example id="accessibility" title="装饰与含义" demo={Labelled}>
          旁边已有文字时图标只是装饰，默认对读屏隐藏；单独出现、表达含义的图标要给{' '}
          <Code>aria-label</Code>。
        </Example>
        <Example id="draw" title="描线动画" demo={Draw}>
          <Code>draw</Code> 由 false 变为 true 时一笔画出；开启“减少动态效果”时直接画好。
        </Example>
        <Example id="custom" title="自定义图标" demo={Custom}>
          按 Lucide 的格式写节点即可，画布默认 24 格。
        </Example>
      </ExampleColumn>
    </Examples>
    <Flex direction="column" gap="md">
      <H2 id="library" size="xl" anchor>
        图标库
      </H2>
      <Paragraph tone="muted">
        搜索并点选一个图标，复制导入代码。图标来自 Lucide，按英文名搜索（如 arrow、user、chart）。
      </Paragraph>
      <IconLibrary />
    </Flex>
    <ApiReference api={api} />
  </DocPage>
));
