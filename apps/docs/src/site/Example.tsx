/**
 * 一个示例：小节标题（带锚点，进本页目录）、说明文字、示例卡片（效果 + 源码，可以带进演练场编辑）。
 *
 *   import Variants from './demo/Variants.tsx?demo';
 *   <Example id="variants" title="样式" demo={Variants}>六种样式对应不同的强调程度…</Example>
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  CodePreview,
  createFlex,
  dataAttrs,
  H2,
  Paragraph,
  type CodePreviewAligns,
} from '@vue-tsx-pro/ui';
import { h, type VNodeChild } from 'vue';
import { canvasStyles } from './canvas';
import { EditInPlayground } from './EditInPlayground';
import type { Demo } from './types';

const styles = stylex.create({
  canvas: { minHeight: '7rem' },
  description: { color: '_textMuted' },
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
  return () => (
    <Section direction="column" gap="md">
      <H2 id={id} size="xl" anchor>
        {title}
      </H2>
      {children != null && <Paragraph sx={styles.description}>{children}</Paragraph>}
      <CodePreview
        code={demo.source}
        align={align}
        actions={<EditInPlayground code={demo.source} />}
        propsPreview={{
          sx: [canvasStyles.canvas, styles.canvas],
          // 示例里的标题不进本页目录（App 收集目录时跳过 data-demo 里的标题）
          ...dataAttrs({ 'data-demo': '' }),
        }}
      >
        {h(demo.component)}
      </CodePreview>
    </Section>
  );
});
