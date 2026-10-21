/** 文档站组件（CodePreview、PropsTable）自带的文案：不在 Lang 里，新增一种语言不必翻（见 config/lang/messages.ts） */
import type { MessageTable } from '../config/lang/messages';

/** 文档站组件的文案 */
export interface DocsKitMessages {
  /** CodePreview：预览区域的名称，默认“预览” */
  readonly preview: string;
  /** CodePreview：显示源码的按钮，默认“显示代码” */
  readonly showCode: string;
  /** CodePreview：收起源码的按钮，默认“隐藏代码” */
  readonly hideCode: string;
  /** PropsTable：“名称”一列的表头，默认“名称” */
  readonly name: string;
  /** PropsTable：“类型”一列的表头，默认“类型” */
  readonly type: string;
  /** PropsTable：“默认值”一列的表头，默认“默认值” */
  readonly defaultValue: string;
  /** PropsTable：“说明”一列的表头，默认“说明” */
  readonly description: string;
  /** PropsTable：必填的 prop 的标记，默认“必填” */
  readonly required: string;
  /** PropsTable：能 _bind 双向绑定的 prop 的标记，默认“可绑定” */
  readonly bindable: string;
}

/** 文档站组件的文案表 */
export const docsKitMessages: MessageTable<DocsKitMessages> = {
  'zh-CN': {
    preview: '预览',
    showCode: '显示代码',
    hideCode: '隐藏代码',
    name: '名称',
    type: '类型',
    defaultValue: '默认值',
    description: '说明',
    required: '必填',
    bindable: '可绑定',
  },
  'en-US': {
    preview: 'Preview',
    showCode: 'Show code',
    hideCode: 'Hide code',
    name: 'Name',
    type: 'Type',
    defaultValue: 'Default',
    description: 'Description',
    required: 'Required',
    bindable: 'Bindable',
  },
};
