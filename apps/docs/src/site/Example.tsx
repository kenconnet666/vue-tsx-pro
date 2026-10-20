/**
 * 一个示例：小节标题（带锚点，进本页目录）、说明文字、示例卡片（效果 + 源码，可以带进演练场编辑）。
 *
 *   import Variants from './demo/Variants.tsx?demo';
 *   <Example id="variants" title="样式" demo={Variants}>六种样式对应不同的强调程度…</Example>
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { CodePreview, createFlex, H2, Paragraph, type CodePreviewAligns } from '@vue-tsx-pro/ui';
import { h, type VNodeChild } from 'vue';
import { canvasStyles } from './canvas';
import { EditInPlayground } from './EditInPlayground';
import { ExamplesContext } from './Examples';
import type { Demo } from './types';

const styles = stylex.create({
  canvas: { minHeight: '7rem' },
  description: { color: '_textMuted' },
  // 多列里：整个小节留在同一列；上下两个示例之间比左右两列之间留得更开，一眼看出哪段说明属于哪张卡片
  inColumns: { breakInside: 'avoid', paddingBlockEnd: '3rem' },
});

/** 每个示例是一个小节（section） */
const Section = createFlex('section', 'ExampleSection');

/** Example 的属性 */
export interface ExampleProps {
  /** 小节的锚点（英文，本页唯一） */
  id: string;
  /** 小节标题 */
  title: string;
  /** `?demo` 导入的示例 */
  demo: Demo;
  /** 效果区的排列，默认 start */
  align?: keyof CodePreviewAligns;
  /** 说明文字 */
  children?: VNodeChild;
}

/** 示例小节：标题、说明、示例卡片 */
export const Example = _component(({ id, title, demo, align, children }: ExampleProps) => {
  const inColumns = ExamplesContext.inject(null) !== null;
  return () => (
    <Section direction="column" gap="md" sx={inColumns && styles.inColumns}>
      <H2 id={id} size="xl" anchor>
        {title}
      </H2>
      {children != null && <Paragraph sx={styles.description}>{children}</Paragraph>}
      <CodePreview
        code={demo.source}
        align={align}
        actions={<EditInPlayground code={demo.source} />}
        propsPreview={{ sx: [canvasStyles.canvas, styles.canvas] }}
      >
        {h(demo.component)}
      </CodePreview>
    </Section>
  );
});
