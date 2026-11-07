import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import groupApi from 'virtual:api/FloatButtonGroupProps';
import api from 'virtual:api/FloatButtonProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import { KeyboardReference } from '../../../site/KeyboardReference';
import Corner from './demo/Corner.tsx?demo';
import SpeedDial from './demo/SpeedDial.tsx?demo';

export const meta = {
  title: 'FloatButton 浮动按钮',
  description:
    '页面角落的常驻操作：客服、反馈、新建、回到顶部。单个或一组固定在视口的结束边与底部，也可以是点开才展开的速拨。',
  order: 11,
};

export default _component(() => () => (
  <DocPage
    meta={meta}
    imports="import { BackTop, FloatButton, FloatButtonGroup } from '@zerodep-dev/vue-tsx-pro-ui';"
  >
    <Examples>
      <ExampleColumn>
        <Example id="group" title="一组按钮与回到顶部" demo={Corner}>
          按钮是圆形的 IconButton，悬停或聚焦时提示名称（<Code>tooltip</Code> 默认就是{' '}
          <Code>aria-label</Code>），<Code>badge</Code> 是未读数或小圆点。单个 FloatButton
          自己固定在角落；放进 <Code>FloatButtonGroup</Code> 时竖排在一起，<Code>BackTop</Code>{' '}
          {
            '也能放进来，滚过阈值才出现、没出现时不占位。位置在结束边（从右到左排版时在左下），留出刘海屏的安全区；要避开底部的操作栏时用 '
          }
          <Code>sx</Code> 改 <Code>insetBlockEnd</Code>。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="speed-dial" title="速拨" demo={SpeedDial}>
          给 FloatButtonGroup 一个 <Code>icon</Code>{' '}
          {'就是速拨：其余按钮收在主按钮里，点一下从上方依次展开，主按钮变成关闭；'}
          <Code>_open</Code> 是双向的展开状态，选了一项后由父级收起。主按钮带{' '}
          <Code>aria-expanded</Code>、<Code>aria-controls</Code>，Esc
          或点到按钮以外的地方收起，焦点回到主按钮。
        </Example>
      </ExampleColumn>
    </Examples>
    <KeyboardReference
      keys={[
        ['Tab', '按钮依次在 Tab 顺序里，聚焦时提示名称'],
        ['Enter / Space', '在速拨的主按钮上：展开、收起'],
        ['Esc', '速拨展开时：收起，焦点回到主按钮'],
      ]}
    />
    <ApiReference api={[api, groupApi]} />
  </DocPage>
));
