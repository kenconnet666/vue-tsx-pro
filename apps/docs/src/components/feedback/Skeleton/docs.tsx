import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/SkeletonProps';
import textApi from 'virtual:api/SkeletonTextProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { ExampleColumn, Examples } from '../../../site/Examples';
import { Example } from '../../../site/Example';
import Layouts from './demo/Layouts.tsx?demo';
import Shapes from './demo/Shapes.tsx?demo';
import Table from './demo/Table.tsx?demo';
import Wrapping from './demo/Wrapping.tsx?demo';

export const meta = {
  title: 'Skeleton 骨架屏',
  description: '内容加载时的占位：大致勾出将要出现的布局，一道光带扫过表示内容正在来。',
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { Skeleton, SkeletonText } from '@zerodep-dev/vue-tsx-pro-ui';"
  >
    <Examples>
      <ExampleColumn>
        <Example id="shapes" title="形状" demo={Shapes}>
          <Code>variant</Code> 给出常用形状：文字行、标题、头像、按钮、图片；多行段落用
          SkeletonText，最后一行短一些，各行的光带依次错开。其他大小用 <Code>sx</Code> 给。
        </Example>
        <Example id="wrapping" title="包着内容" demo={Wrapping}>
          包着真实内容时，内容照常排版但看不见，占位正好是内容的大小，加载完换成内容时布局不跳。
          <Code>delay</Code> 让几块骨架依次扫过，连成一道波；间隔用 <Code>SHIMMER_STAGGER</Code>{' '}
          的倍数，与列表、表格的骨架行节奏一致。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="layouts" title="常见布局" demo={Layouts}>
          按真实布局拼骨架：文章（配图、标题、段落）、消息列表（头像加两行文字）、看板、表单。Card、Stat
          自带 <Code>loading</Code>；自己拼的骨架换成内容时给内容加{' '}
          <Code>shimmerStyles.reveal</Code> 淡入，不要硬切，并在整块区域上加 <Code>aria-busy</Code>
          。
        </Example>
        <Example id="table" title="表格" demo={Table}>
          DataTable
          没有数据又在加载时显示骨架行，每列长短不一，光带一行接一行往下推；已有数据时刷新只在表头下方显示进度条。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={[api, textApi]} />
  </DocPage>
));
