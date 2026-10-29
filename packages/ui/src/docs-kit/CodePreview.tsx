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
 * 示例多的页面可以按需加载源码：`code={() => import('./Basic.tsx?raw').then((m) => m.default)}`，
 * 指针移到、焦点进入工具栏或展开时才取，源码不进页面的块。
 * actions 往工具栏最前面加按钮，例如文档站的“在演练场里编辑”。
 * 外框是 Card（outline），源码是 CodeBlock，收起展开用 Collapse（高度过渡，收起后页内搜索仍能找到）。
 */
import { Code as CodeIcon } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { useId, watch, type VNodeChild } from 'vue';
import { Button, type ButtonProps } from '../base/Button';
import { CodeBlock, type CodeBlockProps } from '../base/CodeBlock';
import { CopyButton, type CopyButtonProps } from '../base/CopyButton';
import { useMessages } from '../config/lang/messages';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { ScrollArea, type ScrollAreaProps } from '../layout/ScrollArea';
import { Card, type CardProps } from '../display/Card';
import { Collapse, type CollapseProps } from '../display/Collapse';
import { docsKitMessages } from './messages';

/** 效果区的排列 */
export interface CodePreviewAligns {
  /** 从起始边排起、占满宽度（默认）：表单、卡片、长内容 */
  start: unknown;
  /** 居中：单个按钮、图标这类小东西 */
  center: unknown;
}

/** 未声明的属性落到外框（Card 的 div）上 */
export interface CodePreviewProps extends PartProps<'div'> {
  /** 源码；或按需加载的函数：指针移到、焦点进入工具栏、展开或复制时才调用（只调用一次） */
  code: string | (() => Promise<string>);
  /** 源码的语言，默认 tsx */
  lang?: string;
  /** 是否显示源码：父级可以写 _showCode={x}；默认收起 */
  _showCode?: boolean;
  /** 效果区的排列，默认 start */
  align?: keyof CodePreviewAligns;
  /** 源码超过这么多行时折叠（见 CodeBlock 的 maxLines）；不写时不折叠 */
  maxLines?: number;
  /** 工具栏上额外的操作，排在“显示代码”前面 */
  actions?: VNodeChild;
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
export const codePreviewStyles = css.create({
  // 效果区：给了最小高度时，效果在里面上下居中
  preview: { display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  // 效果的排布：靠起始边时示例占满宽度（里面的网格、卡片按整块宽度排），居中时按内容宽度居中；
  // 宽内容（表格）在外面的 ScrollArea 里横向滚动，不撑宽卡片
  layout: {
    display: 'grid',
    alignItems: 'center',
    gap: '_md',
    padding: '_xl',
  },
  center: { justifyItems: 'center' },
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
    _showCode: showCode = _bindable(false),
    align = 'start',
    maxLines,
    actions,
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
    const messages = useMessages('docsKit', docsKitMessages);
    const codeId = useId();
    // 收起的源码先按纯文本渲染（页内搜索照样找得到）：要显示时才高亮。指针移到、焦点落到“显示代码”上就开始，
    // 点下去时多半已经高亮好了。一页十来个示例，打开页面时不必一次高亮全部
    let wanted = _state(false);
    // 按需加载的源码：同一个加载函数只取一次；换了加载函数（示例热更新）就重新取
    let loaded = _state<string | null>(null);
    let loadedFrom: unknown;
    let pending: Promise<string> | undefined;
    const source = () => (typeof code === 'string' ? code : loadedFrom === code ? loaded : null);
    function load(): string | Promise<string> {
      if (typeof code === 'string') return code;
      if (loadedFrom === code) return loaded ?? pending!;
      const from = code;
      loadedFrom = from;
      loaded = null;
      pending = from().then((text) => {
        if (loadedFrom === from) loaded = text;
        return text;
      });
      return pending;
    }
    const prepare = () => {
      wanted = true;
      void load();
    };
    watch(
      () => showCode,
      (shown) => shown && void load(),
      { immediate: true },
    );
    return () => (
      <Card
        {...mergePartProps<CardProps>(
          { variant: 'outline', padding: 'none', propsFooter: { sx: codePreviewStyles.footer } },
          propsCard,
          rest as Partial<CardProps>,
        )}
        footer={
          <>
            <div
              {...mergeAttrs<'div'>({ sx: codePreviewStyles.toolbar }, propsToolbar, {
                // 工具栏上的意图（要看、要复制、要编辑）：开始加载与高亮，点下去时多半已经好了
                onPointerenter: prepare,
                onFocusin: prepare,
              })}
            >
              {actions}
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
                {showCode ? messages.hideCode : messages.showCode}
              </Button>
              <CopyButton
                {...mergePartProps<CopyButtonProps>(
                  {
                    variant: 'ghost',
                    tone: 'neutral',
                    size: 'sm',
                    value: () => source() ?? load(),
                  },
                  propsCopy,
                )}
              />
            </div>
            <Collapse
              {...mergePartProps<CollapseProps>({}, propsCollapse, { id: codeId })}
              _open={showCode}
            >
              <CodeBlock
                {...mergePartProps<CodeBlockProps>(
                  {
                    code: source() ?? '',
                    lang,
                    highlight: showCode || wanted,
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
            'aria-label': messages.preview,
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
