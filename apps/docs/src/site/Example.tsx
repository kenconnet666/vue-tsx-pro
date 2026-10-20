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
import { EditInPlayground } from './EditInPlayground';
import type { Demo } from './types';

const styles = stylex.create({
  // 效果区是一块“画布”：淡淡的点阵与页面区分开；字号、行高改回界面默认值，示例显示的就是组件的默认大小
  canvas: {
    minHeight: '7rem',
    fontSize: '_md',
    lineHeight: '_normal',
    backgroundColor: '_surface',
    backgroundImage: 'radial-gradient(_colors.border 1px, transparent 1px)',
    backgroundSize: '18px 18px',
    backgroundPosition: '-9px -9px',
  },
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
export const Example = _component(({ id, title, demo, align, children }: ExampleProps) => () => (
  <Section direction="column" gap="md">
    <H2 id={id} size="xl" anchor>
      {title}
    </H2>
    {children != null && <Paragraph sx={styles.description}>{children}</Paragraph>}
    <CodePreview
      code={demo.source}
      align={align}
      actions={<EditInPlayground code={demo.source} />}
      propsPreview={{ sx: styles.canvas }}
    >
      {h(demo.component)}
    </CodePreview>
  </Section>
));
