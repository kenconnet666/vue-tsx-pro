import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code, Link } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/ColorPickerProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { KeyboardReference } from '../../../site/KeyboardReference';
import Button from './demo/Button.tsx?demo';

export const meta = {
  title: 'ColorPicker 取色器',
  description:
    '饱和度与明度的色板、色相与不透明度滑块、吸管、按格式输入、预设与最近使用。平铺在页面上，或放进 ColorField 的弹出层。',
  order: 13,
};

export default _component(() => () => (
  <DocPage meta={meta} imports="import { ColorPicker } from '@zerodep-dev/vue-tsx-pro-ui';">
    <Example id="button" title="按钮配色" demo={Button}>
      <Code>_value</Code>
      {
        ' 是 #rrggbb（有透明度时 #rrggbbaa），拖动时实时写回；内部按 HSV 记着，拖到灰色、黑色时色相不丢。色相、不透明度是 Slider，轨道画成渐变；'
      }
      <Code>alpha={'{false}'}</Code>
      {
        ' 去掉不透明度。输入框按 HEX、RGB、HSL 显示，写任何 CSS 颜色都认，回车或失焦写回。支持 EyeDropper 的浏览器（Chromium）里有吸管，从屏幕上任何地方取色。'
      }
      <Code>presets</Code>
      {' 是预设，最近使用的颜色在同一个页面的取色器之间共用。表单里要一个输入框时用 '}
      <Link href="/components/color-field">ColorField</Link>，点色块弹出的就是它。
    </Example>
    <KeyboardReference
      keys={[
        ['← / →', '在色板上：降低、提高饱和度（按住 Shift 一次 10%）'],
        ['↓ / ↑', '在色板上：降低、提高明度'],
        ['← / → / Home / End', '在色相、不透明度滑块上：同 Slider'],
        ['Enter', '在输入框里：按当前文字解析颜色并写回'],
      ]}
    >
      色板是 role="slider"，读屏念“饱和度 80%，明度
      45%”；预设与最近使用的每一格是按钮，名称是颜色值，选中的带 aria-pressed。
    </KeyboardReference>
    <ApiReference api={api} />
  </DocPage>
));
