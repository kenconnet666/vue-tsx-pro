import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/ButtonProps';
import groupApi from 'virtual:api/ButtonGroupProps';
import linkApi from 'virtual:api/LinkButtonProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Examples } from '../../../site/Examples';
import { Example } from '../../../site/Example';
import Basic from './demo/Basic.tsx?demo';
import Disabled from './demo/Disabled.tsx?demo';
import FullWidth from './demo/FullWidth.tsx?demo';
import Group from './demo/Group.tsx?demo';
import Links from './demo/Links.tsx?demo';
import Loading from './demo/Loading.tsx?demo';
import Radius from './demo/Radius.tsx?demo';
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
  <DocPage
    wide
    meta={meta}
    imports="import { Button, ButtonGroup, LinkButton } from '@vue-tsx-pro/ui';"
  >
    <Examples>
      <Example id="basic" title="基础用法" demo={Basic}>
        一组操作里只有一个主要操作用默认的实底样式，其余按重要程度依次减弱；破坏性操作放在另一侧。
      </Example>
      <Example id="variants" title="样式" demo={Variants}>
        六种样式对应不同的强调程度：<Code>solid</Code> 最醒目，<Code>link</Code>{' '}
        像文字链接，放在句子中间。
      </Example>
      <Example id="tones" title="色调" demo={Tones}>
        六种色调与六种样式任意组合，和 Badge、Alert 等是同一套色调：<Code>neutral</Code>{' '}
        用于不需要强调的操作（如“取消”），<Code>danger</Code> 用于删除这类破坏性操作，
        <Code>info</Code>、<Code>success</Code>、<Code>warning</Code> 用于和提示信息呼应的操作。
      </Example>
      <Example id="sizes" title="尺寸" demo={Sizes}>
        <Code>size</Code> 对应主题的字号档位，内边距、图标随之按比例缩放；不写时继承所在文字的字号。
        IconButton 同样适用。
      </Example>
      <Example id="radius" title="圆角" demo={Radius}>
        <Code>radius</Code> 从直角到胶囊形；图标按钮写 <Code>full</Code> 是圆形。整个应用统一改用{' '}
        <Code>createUi</Code> 的 <Code>defaults.Button</Code>。
      </Example>
      <Example id="icons" title="图标" demo={WithIcon}>
        <Code>icon</Code> 在文字前，<Code>iconEnd</Code>{' '}
        在文字后；文字旁也可以放快捷键、计数。只有图标时用 IconButton，必须写{' '}
        <Code>aria-label</Code>。
      </Example>
      <Example id="loading" title="加载中" demo={Loading}>
        加载中显示旋转指示，宽度不变，点击无效，焦点留在按钮上；很快完成的操作不会闪一下。
      </Example>
      <Example id="full-width" title="占满宽度" demo={FullWidth}>
        <Code>fullWidth</Code> 让按钮占满容器宽度，并排的几个平分：登录框、移动端底部的操作。
      </Example>
      <Example id="links" title="链接按钮" demo={Links}>
        跳转到别的页面用 <Code>LinkButton</Code>（a 元素）而不是 Button
        加点击跳转：能右键、在新标签页打开，读屏念“链接”。外观同 Button，站内链接经 router
        不刷新页面地跳转，<Code>external</Code> 在新窗口打开。
      </Example>
      <Example id="group" title="按钮组" demo={Group}>
        ButtonGroup 把相关的按钮连成一条：拆分按钮、翻页、缩放、对齐方式。组上写的{' '}
        <Code>variant</Code>、<Code>tone</Code>、<Code>size</Code> 是组里按钮的默认值；
        <Code>orientation="vertical"</Code> 竖排。
      </Example>
      <Example id="disabled" title="不可用" demo={Disabled}>
        <Code>disabled</Code> 是原生的不可用，按钮不能聚焦；需要说明原因时加{' '}
        <Code>focusableWhenDisabled</Code>
        ，按钮仍能聚焦，悬停或聚焦时提示照常显示。
      </Example>
    </Examples>
    <ApiReference api={[api, groupApi, linkApi]} />
  </DocPage>
));
