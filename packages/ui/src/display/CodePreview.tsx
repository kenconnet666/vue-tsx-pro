/**
 * 代码示例卡片：上面是运行中的效果，下面是它的源码（可以收起、复制）。文档站的每个示例都是一张。
 *
 *   import source from './Basic.tsx?raw';
 *   <CodePreview code={source}>
 *     <Basic />
 *   </CodePreview>
 *
 * 效果与源码由使用方各自给出（组件本身不执行代码）：示例组件照常 import，源码用 Vite 的 ?raw 导入同一个文件，
 * 两者永远一致。源码默认收起，“显示代码”按钮带 aria-expanded / aria-controls；复制按钮一直在工具栏上。
 * 外框是 Card（outline），源码是 CodeBlock，收起展开用 Collapse（高度过渡，收起后页内搜索仍能找到）。
 */
import { Code as CodeIcon } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { useId, type VNodeChild } from 'vue';
import { Button, type ButtonProps } from '../base/Button';
import { CodeBlock, type CodeBlockProps } from '../base/CodeBlock';
import { CopyButton, type CopyButtonProps } from '../base/CopyButton';
import { useLang } from '../config/context';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { ScrollArea, type ScrollAreaProps } from '../layout/ScrollArea';
import { Card, type CardProps } from './Card';
import { Collapse, type CollapseProps } from './Collapse';

/** 效果区的排列 */
export interface CodePreviewAligns {
  /** 从起始边排起（默认）：表单、长内容 */
  start: unknown;
  /** 居中：单个按钮、图标这类小东西 */
  center: unknown;
}

/** 未声明的属性落到外框（Card 的 div）上 */
export interface CodePreviewProps extends PartProps<'div'> {
  /** 源码 */
  code: string;
  /** 源码的语言，默认 tsx */
  lang?: string;
  /** 是否显示源码：父级可以写 showCode={_bind(x)}；默认收起 */
  showCode?: boolean;
  /** 效果区的排列，默认 start */
  align?: keyof CodePreviewAligns;
  /** 源码超过这么多行时折叠（见 CodeBlock 的 maxLines）；不写时不折叠 */
  maxLines?: number;
  /** 运行中的效果 */
  children?: VNodeChild;
  /** 外框（Card）的部件属性 */
  propsCard?: Partial<CardProps>;
  /** 效果区的部件属性（外层，背景、最小高度写在这里） */
  propsPreview?: PartProps<'div'>;
  /** 效果区里横向滚动的 ScrollArea 的部件属性 */
  propsPreviewScroll?: Partial<ScrollAreaProps>;
  /** 工具栏的部件属性 */
  propsToolbar?: PartProps<'div'>;
  /** “显示代码”按钮的部件属性 */
  propsToggle?: Partial<ButtonProps>;
  /** 复制按钮的部件属性 */
  propsCopy?: Partial<CopyButtonProps>;
  /** 源码收起展开的部件属性 */
  propsCollapse?: Partial<CollapseProps>;
  /** 源码（CodeBlock）的部件属性 */
  propsCode?: Partial<CodeBlockProps>;
}

/** CodePreview 的样式：preview、center、footer、toolbar、code */
export const codePreviewStyles = stylex.create({
  // 效果区：给了最小高度时，效果在里面上下居中
  preview: { display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  // 效果的排布；宽内容（表格）在外面的 ScrollArea 里横向滚动，不撑宽卡片
  layout: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '_md',
    padding: '_xl',
  },
  center: { justifyContent: 'center' },
  // Card 的页脚默认是一行靠右的按钮：这里是工具栏加源码，上下排
  footer: { display: 'block', padding: 0 },
  toolbar: { display: 'flex', justifyContent: 'flex-end', gap: '_xs', padding: '_xs' },
  // 源码贴着卡片：去掉 CodeBlock 自己的边框与圆角，只留与工具栏之间的分隔线
  code: {
    borderWidth: 0,
    borderTopWidth: '_xs',
    borderRadius: 0,
  },
});

/** 代码示例卡片：效果 + 可收起的源码 + 复制 */
export const CodePreview = _component(
  ({
    code,
    lang = 'tsx',
    showCode = _bindable(false),
    align = 'start',
    maxLines,
    children,
    propsCard,
    propsPreview,
    propsPreviewScroll,
    propsToolbar,
    propsToggle,
    propsCopy,
    propsCollapse,
    propsCode,
    ...rest
  }: CodePreviewProps) => {
    const messages = useLang();
    const codeId = useId();
    return () => (
      <Card
        {...mergePartProps<CardProps>(
          { variant: 'outline', padding: 'none', propsFooter: { sx: codePreviewStyles.footer } },
          propsCard,
          rest as Partial<CardProps>,
        )}
        footer={
          <>
            <div {...mergeAttrs<'div'>({ sx: codePreviewStyles.toolbar }, propsToolbar)}>
              <Button
                {...mergePartProps<ButtonProps>(
                  { variant: 'ghost', tone: 'neutral', size: 'sm', icon: CodeIcon },
                  propsToggle,
                  {
                    'aria-expanded': showCode,
                    'aria-controls': codeId,
                    onClick: () => (showCode = !showCode),
                  },
                )}
              >
                {showCode ? messages.codeHide : messages.codeShow}
              </Button>
              <CopyButton
                {...mergePartProps<CopyButtonProps>(
                  { variant: 'ghost', tone: 'neutral', size: 'sm', value: code },
                  propsCopy,
                )}
              />
            </div>
            <Collapse
              {...mergePartProps<CollapseProps>({}, propsCollapse, { id: codeId })}
              open={_bind(showCode)}
            >
              <CodeBlock
                {...mergePartProps<CodeBlockProps>(
                  {
                    code,
                    lang,
                    maxLines,
                    copyable: false,
                    propsRoot: { sx: codePreviewStyles.code },
                  },
                  propsCode,
                )}
              />
            </Collapse>
          </>
        }
      >
        <div
          {...mergeAttrs<'div'>({ sx: codePreviewStyles.preview }, propsPreview, {
            role: 'group',
            'aria-label': messages.codePreview,
          })}
        >
          <ScrollArea {...mergePartProps<ScrollAreaProps>({ axis: 'x' }, propsPreviewScroll)}>
            <div
              {...mergeAttrs<'div'>({
                sx: [codePreviewStyles.layout, align === 'center' && codePreviewStyles.center],
              })}
            >
              {children}
            </div>
          </ScrollArea>
        </div>
      </Card>
    );
  },
);
