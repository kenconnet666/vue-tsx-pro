import type { Component } from 'vue';

/** `?demo` 导入的结果：示例组件与它的源码 */
export interface Demo {
  /** 示例组件 */
  component: Component;
  /** 加载示例文件的源码（原样显示）：按需加载，不打进页面的块 */
  source: () => Promise<string>;
  /** 相对组件目录、不带扩展名的路径（layout/AppShell/frames/Admin）：整页示例按它打开 /frame/… */
  path: string;
}

/** 每个文档页导出的 meta：字面量，构建时静态读出 */
export interface PageMeta {
  /** 标题：侧栏、页面标题、搜索都用它 */
  title: string;
  /** 一句话简介：页面开头、搜索结果都显示 */
  description: string;
  /** 在分类里的顺序，越小越靠前；不写时按名字排在后面 */
  order?: number;
}

/** virtual:doc-pages 里的一项 */
export interface ComponentPageEntry {
  /** 分类目录名：base、layout… */
  category: string;
  /** 组件文件夹名：Button */
  name: string;
  /** 页面的 meta */
  meta: PageMeta;
  /** 页面里的示例（站内搜索用） */
  examples: readonly ExampleEntry[];
  /** 加载页面组件 */
  load: () => Promise<{ default: Component }>;
}

/** 文档页里的一个示例：锚点、标题，和说明里 <Code> 写到的标识符（属性名、函数名） */
export interface ExampleEntry {
  /** 锚点 */
  id: string;
  /** 标题 */
  title: string;
  /** 说明里写到的标识符：搜索时按它们也能找到这个示例 */
  keywords: readonly string[];
}
