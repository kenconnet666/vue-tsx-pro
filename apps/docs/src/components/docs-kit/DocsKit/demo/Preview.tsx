// 自己文档站里的一节：带锚点的标题、一段说明、一张示例卡片（上面是效果，下面是源码）。
// 效果与源码由使用方各自给出；本站用 Vite 的 ?raw 导入示例文件本身，两者永远一致
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Paragraph, Rating, Small } from '@zerodep-dev/vue-tsx-pro-ui';
import { CodePreview, DocSection } from '@zerodep-dev/vue-tsx-pro-ui/docs-kit';

const source = `let score = _state(3);
<Rating _value={score} aria-label="服务评分" />`;

export default _component(() => {
  let score = _state(3);
  let showCode = _state(false);
  return () => (
    <DocSection id="demo-rating-basic" title="Rating 基础用法">
      <Paragraph>点星星打分，键盘用方向键。</Paragraph>
      <CodePreview code={source} lang="tsx" align="center" _showCode={showCode}>
        <Rating _value={score} aria-label="服务评分" />
      </CodePreview>
      <Small tone="muted">源码{showCode ? '已展开' : '已收起'}</Small>
    </DocSection>
  );
});
