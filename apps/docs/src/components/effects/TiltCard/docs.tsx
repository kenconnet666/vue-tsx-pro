import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/TiltCardProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Options from './demo/Options.tsx?demo';
import Pricing from './demo/Pricing.tsx?demo';

export const meta = {
  title: 'TiltCard 倾斜卡片',
  description:
    '指针在上面移动时整块向指针方向倾斜，带一层跟随指针的高光，离开后弹回。纯 CSS 与弹簧，不依赖 WebGL。',
  order: 10,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { TiltCard } from '@vue-tsx-pro/ui';">
    <Examples>
      <ExampleColumn>
        <Example id="pricing" title="价格卡片" demo={Pricing}>
          包住任意内容，常见是 <Code>Card</Code>
          ；内容的语义与焦点顺序不变，按钮照常可点。回弹与时长取主题的动效
          token；系统要求减少动态效果时不倾斜、不放大。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="options" title="角度、放大与高光" demo={Options}>
          <Code>maxTilt</Code> 是最大倾斜角度，<Code>scale</Code> 是悬停时的放大倍数，
          <Code>glare</Code> 是跟随指针的高光（品牌浅色混在浮起表面色里，亮暗主题都是提亮）。
          <Code>disabled</Code> 时不倾斜，例如列表在拖动排序时。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
