// 嵌入的页面：定比例、延迟加载，加载完之前是骨架；title 必填。
// 实际使用时 src 是地图、播放器、报表的地址；这里用 srcdoc 放一份内联的页面，示例不依赖外网
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Embed, Figure } from '@zerodep-dev/vue-tsx-pro-ui';

const report = `<!doctype html>
<meta charset="utf-8">
<style>
  body { margin: 0; display: grid; place-items: center; height: 100vh; font: 14px system-ui, sans-serif;
    background: linear-gradient(135deg, #eef2ff, #f8fafc); color: #1f2937; }
  strong { font-size: 28px; }
</style>
<div style="text-align:center"><strong>96.2%</strong><br>十月准时交付率</div>`;

export default _component(() => () => (
  <Figure caption="嵌入的报表：外层的边框、圆角跟随主题，宽高比 16 / 9">
    <Embed src="about:blank" srcdoc={report} title="十月准时交付率报表" sandbox="" />
  </Figure>
));
