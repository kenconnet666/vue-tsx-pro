/// <reference types="vite/client" />

/** `import Basic from './demo/Basic.tsx?demo'`：示例组件与按需加载源码的函数（build/demo.ts） */
declare module '*?demo' {
  const demo: import('./site/types').Demo;
  export default demo;
}

/** `import api from 'virtual:api/ButtonProps'`：从类型与 JSDoc 生成的 API 数据（build/api.ts） */
declare module 'virtual:api/*' {
  const api: import('@zerodep-dev/vue-tsx-pro-ui/docs-kit').ComponentApi;
  export default api;
}

/** 全部组件的目录：组件名、从哪个入口导入、分类与 API 数据（build/api.ts，组件演练场用） */
declare module 'virtual:api-catalog' {
  const catalog: {
    name: string;
    entry: string;
    category: string;
    api: import('@zerodep-dev/vue-tsx-pro-ui/docs-kit').ComponentApi;
  }[];
  export default catalog;
}

/** 组件文档页的清单（build/pages.ts） */
declare module 'virtual:doc-pages' {
  const pages: import('./site/types').ComponentPageEntry[];
  export default pages;
}

/** 浏览器里的 TypeScript 7（build/tsgo.ts）：gzip 过的 wasm 的地址与构建信息 */
declare module 'virtual:tsgo-wasm' {
  export const tsgoWasmUrl: string;
  /** 构建日期与提交（“2026-11-04 · e2bc2bc”） */
  export const tsgoBuild: string;
}
