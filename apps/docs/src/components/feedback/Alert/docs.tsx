import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/AlertProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Status from './demo/Status.tsx?demo';
import Tones from './demo/Tones.tsx?demo';
import Variants from './demo/Variants.tsx?demo';

export const meta = {
  title: 'Alert 提示条',
  description:
    '页面或区块里的说明、成功、警告、错误信息：图标按色调自动选，可带操作、加载中、可以关闭。',
  order: 0,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { Alert } from '@vue-tsx-pro/ui';">
    <Examples>
      <ExampleColumn>
        <Example id="tones" title="色调" demo={Tones}>
          <Code>tone</Code> 决定颜色与默认图标（Lucide），<Code>icon</Code> 可以换，写 false
          去掉。页面加载时就在的提示不打断读屏；操作后才出现的写 <Code>live</Code> 让读屏播报。
        </Example>
        <Example id="status" title="进行中、播报与尺寸" demo={Status}>
          操作后才出现的提示写 <Code>live="polite"</Code>
          （role="status"），读屏念完当前内容再念；错误等紧急信息用 <Code>assertive</Code>。
          <Code>loading</Code> 时图标换成加载指示并带 aria-busy，结果出来后换掉内容即可。
          <Code>size</Code> 是字号档位，图标与内边距随之缩放。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="variants" title="样式、操作与关闭" demo={Variants}>
          <Code>variant</Code> 有 soft、surface、outline；<Code>action</Code> 放在右侧，
          <Code>loading</Code> 时图标换成旋转指示，写了 <Code>onClose</Code> 就有关闭按钮。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
