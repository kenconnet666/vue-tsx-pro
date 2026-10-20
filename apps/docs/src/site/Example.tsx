/**
 * 一个示例：小节标题（带锚点，进本页目录）、说明文字、示例卡片（效果 + 源码，可以带进演练场编辑）。
 *
 *   import Variants from './demo/Variants.tsx?demo';
 *   <Example id="variants" title="样式" demo={Variants}>六种样式对应不同的强调程度…</Example>
 *
 * 按视口排版、占整页的示例（AppShell）放在 frames 目录，写 frame 给出高度，效果区用 iframe 单独打开它：
 *
 *   import Admin from './frames/Admin.tsx?demo';
 *   <Example id="admin" title="后台" demo={Admin} frame="36rem" />
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
import { framePath } from '../router';
import { canvasStyles } from './canvas';
import { EditInPlayground } from './EditInPlayground';
import type { Demo } from './types';

const styles = stylex.create({
  canvas: { minHeight: '7rem' },
  // iframe 贴满效果区，不留内边距
  framed: { padding: 0 },
  frame: { display: 'block', width: '100%', borderStyle: 'none' },
  description: { color: '_textMuted' },
});

const frameHeight = stylex.create({ height: (height: string) => ({ height }) });

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
  /** 整页示例：效果区的高度（CSS 长度），示例在 iframe 里单独打开（只限 frames 目录里的示例） */
  frame?: string;
  /** 说明文字 */
  children?: VNodeChild;
}

/** 示例小节：标题、说明、示例卡片 */
export const Example = _component(({ id, title, demo, align, frame, children }: ExampleProps) => {
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
          sx: [canvasStyles.canvas, styles.canvas, frame != null && styles.framed],
          // 示例里的标题不进本页目录（App 收集目录时跳过 data-demo 里的标题）
          ...dataAttrs({ 'data-demo': '' }),
        }}
      >
        {frame != null ? (
          <iframe
            src={framePath(demo.path)}
            title={title}
            loading="lazy"
            {...stylex.attrs(styles.frame, frameHeight.height(frame))}
          />
        ) : (
          h(demo.component)
        )}
      </CodePreview>
    </Section>
  );
});
