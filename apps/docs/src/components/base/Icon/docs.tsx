import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/IconProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Examples } from '../../../site/Examples';
import { Example } from '../../../site/Example';
import Basic from './demo/Basic.tsx?demo';
import Custom from './demo/Custom.tsx?demo';
import Draw from './demo/Draw.tsx?demo';
import Labelled from './demo/Labelled.tsx?demo';
import Sizes from './demo/Sizes.tsx?demo';

export const meta = {
  title: 'Icon 图标',
  description: '渲染 Lucide 格式的图标数据：按名导入、可摇树，也能画自己的图标。',
  order: 2,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports={"import { Icon } from '@vue-tsx-pro/ui';\nimport { Search } from '@lucide/icons';"}
  >
    <Examples>
      <Example id="basic" title="基础用法" demo={Basic}>
        从 <Code>@lucide/icons</Code> 按名导入图标数据交给 <Code>icon</Code>；只打包用到的图标。
      </Example>
      <Example id="sizes" title="尺寸与线宽" demo={Sizes}>
        不写 <Code>size</Code> 时是 1em，跟随所在文字；档位对应主题字号，数字是像素。
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
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
