/**
 * 文档站组件（子路径 `@vue-tsx-pro/ui/docs-kit`）：给组件写文档的页面用，业务界面用不到，不放在主入口。
 *
 *   import { CodePreview, PropsTable } from '@vue-tsx-pro/ui/docs-kit';
 *
 * 文案自带中英文（messages.ts），别的语言在 Lang.messages.docsKit 里补。
 * 代码块 CodeBlock、标题锚点、页内目录 TableOfContents、翻页 Pager 在主入口：帮助中心、文章页也用得上。
 */
export { CodeGroup, codeGroupStyles, type CodeGroupItem, type CodeGroupProps } from './CodeGroup';
export {
  CodePreview,
  codePreviewStyles,
  type CodePreviewAligns,
  type CodePreviewProps,
} from './CodePreview';
export {
  PropsTable,
  propsTableStyles,
  type ApiProp,
  type ApiPropKinds,
  type ApiValue,
  type ComponentApi,
  type PropsTableProps,
} from './PropsTable';
export { docsKitMessages, type DocsKitMessages } from './messages';
