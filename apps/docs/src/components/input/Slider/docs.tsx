import { _component } from '@vue-tsx-pro/tsx';
import { Code, Kbd } from '@vue-tsx-pro/ui';
import api from 'virtual:api/SliderProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Equalizer from './demo/Equalizer.tsx?demo';
import Player from './demo/Player.tsx?demo';
import Price from './demo/Price.tsx?demo';

export const meta = {
  title: 'Slider 滑块',
  description:
    '在一个范围里拖动选值：音量、进度、价格区间。单值或 [低, 高] 范围，刻度、竖排、色调；键盘与读屏同 WAI-ARIA Slider 模式。',
  order: 4,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { Slider } from '@vue-tsx-pro/ui';">
    <Examples>
      <ExampleColumn>
        <Example id="player" title="播放器" demo={Player}>
          <Code>valueText</Code> 是读屏念的值（“1:12 / 4:05”）。<Kbd>←</Kbd> <Kbd>→</Kbd> 按{' '}
          <Code>step</Code> 走，<Kbd>Page Up</Kbd> / <Kbd>Page Down</Kbd> 按 <Code>bigStep</Code>
          （默认十分之一），
          <Kbd>Home</Kbd> / <Kbd>End</Kbd> 到两端；点轨道任意位置直接跳过去并接着拖。
        </Example>
        <Example id="range" title="价格区间与刻度" demo={Price}>
          <Code>value</Code> 是 <Code>[低, 高]</Code>{' '}
          时选一个范围：两个滑块各自可聚焦、不能交叉，读屏名称后面加上“最小值”“最大值”。
          <Code>marks</Code> 是刻度；拖动时实时写回，<Code>onValueCommit</Code>{' '}
          在松手时调用一次，适合去查询接口。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="vertical" title="竖排的均衡器" demo={Equalizer}>
          <Code>orientation="vertical"</Code>：<Kbd>↑</Kbd> 增大、<Kbd>↓</Kbd> 减小。数值用
          number：需要精确小数或超大整数的输入用 NumberField。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
