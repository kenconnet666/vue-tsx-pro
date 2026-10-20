import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/ButtonProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Examples } from '../../../site/Examples';
import { Example } from '../../../site/Example';
import Basic from './demo/Basic.tsx?demo';
import Disabled from './demo/Disabled.tsx?demo';
import Loading from './demo/Loading.tsx?demo';
import Sizes from './demo/Sizes.tsx?demo';
import Tones from './demo/Tones.tsx?demo';
import Variants from './demo/Variants.tsx?demo';
import WithIcon from './demo/WithIcon.tsx?demo';

export const meta = {
  title: 'Button 按钮',
  description: '触发一个操作：提交表单、打开对话框、删除一项。跳转到别的页面用 LinkButton。',
  order: 1,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { Button } from '@vue-tsx-pro/ui';">
    <Examples>
      <Example id="basic" title="基础用法" demo={Basic}>
        一组操作里只有一个主要操作用默认的实底样式，其余用更轻的样式。
      </Example>
      <Example id="variants" title="样式" demo={Variants}>
        六种样式对应不同的强调程度：<Code>solid</Code> 最醒目，<Code>link</Code>{' '}
        像文字链接，放在句子中间。
      </Example>
      <Example id="tones" title="色调" demo={Tones}>
        <Code>neutral</Code> 用于不需要强调的操作（如“取消”），<Code>danger</Code>{' '}
        用于删除这类破坏性操作。
      </Example>
      <Example id="sizes" title="尺寸" demo={Sizes}>
        <Code>size</Code> 对应主题的字号档位，内边距、图标随之按比例缩放；不写时继承所在文字的字号。
      </Example>
      <Example id="icons" title="图标" demo={WithIcon}>
        <Code>icon</Code> 在文字前，<Code>iconEnd</Code> 在文字后；只有图标时用 IconButton。
      </Example>
      <Example id="loading" title="加载中" demo={Loading}>
        加载中显示旋转指示，宽度不变，点击无效，焦点留在按钮上；很快完成的操作不会闪一下。
      </Example>
      <Example id="disabled" title="不可用" demo={Disabled}>
        <Code>disabled</Code> 是原生的不可用，按钮不能聚焦；需要说明原因时加{' '}
        <Code>focusableWhenDisabled</Code>
        ，按钮仍能聚焦、悬停提示照常显示。
      </Example>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
