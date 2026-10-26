import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code, CodeBlock } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/ButtonBaseProps';
import hiddenApi from 'virtual:api/VisuallyHiddenProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Hidden from './demo/Hidden.tsx?demo';
import Plans from './demo/Plans.tsx?demo';
import States from './demo/States.tsx?demo';

export const meta = {
  title: 'ButtonBase 无障碍与基础部件',
  description:
    'ButtonBase 是没有外观的按钮，菜单项、标签页、折叠标题这类“长得不像按钮的按钮”都建在它上面；VisuallyHidden 放只给读屏器看的文字。',
  order: 20,
};

const shared = `import { buttonBaseStyles, focusRingStyles, useButtonBehavior } from '@zerodep-dev/vue-tsx-pro-ui';

// 不想多一层组件时（比如渲染成 a 或 div[role=button]），直接用同一套样式与行为
const behavior = useButtonBehavior(
  () => ({ disabled, loading }),
  () => onClick,
);
<a sx={[buttonBaseStyles.root, focusRingStyles.visible]} {...behavior()} />`;

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { ButtonBase, VisuallyHidden } from '@zerodep-dev/vue-tsx-pro-ui';"
  >
    <Example id="plans" title="自定义外观的按钮" demo={Plans}>
      ButtonBase 去掉浏览器的默认样式，给出焦点环、按下的波纹、颜色过渡，默认{' '}
      <Code>type="button"</Code>（不会意外提交表单）；外观全部经 <Code>sx</Code> 给出。选中状态用{' '}
      <Code>aria-pressed</Code> 写给读屏，一组单选的卡片外面包 <Code>role="group"</Code>{' '}
      与名称。要按钮外观时用 Button。
    </Example>
    <Examples>
      <ExampleColumn>
        <Example id="states" title="不可用与加载中" demo={States}>
          <Code>disabled</Code> 写原生 disabled，Tab 跳过；加上 <Code>focusableWhenDisabled</Code>{' '}
          改用 aria-disabled，焦点仍能停留（菜单、工具栏里不希望焦点跳过它）。
          <Code>loading</Code> 时点击无效、带 aria-busy。三种状态都写 data
          属性（data-disabled、data-loading），外观由使用方按需给。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="hidden" title="只给读屏器看的文字" demo={Hidden}>
          <Code>VisuallyHidden</Code> 视觉上不占位，读屏照常朗读（不用 display:
          none，那样读屏也读不到）。用来补上图形、数字、缩写背后的意思；Link 的{' '}
          <Code>external</Code> 已经内置“在新窗口打开”。右列是按 DOM 粗略算出的朗读文字。
        </Example>
      </ExampleColumn>
    </Examples>
    <CodeBlock code={shared} lang="tsx" title="同一套样式与行为" />
    <ApiReference api={[api, hiddenApi]} />
  </DocPage>
));
