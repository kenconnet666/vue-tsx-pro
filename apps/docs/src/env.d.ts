/// <reference types="vite/client" />

/** `import Basic from './demo/Basic.tsx?demo'`：示例组件与按需加载源码的函数（build/demo.ts） */
declare module '*?demo' {
  const demo: import('./site/types').Demo;
  export default demo;
}

/** `import api from 'virtual:api/ButtonProps'`：从类型与 JSDoc 生成的 API 数据（build/api.ts） */
declare module 'virtual:api/*' {
  const api: import('@vue-tsx-pro/ui').ComponentApi;
  export default api;
}

/** 全部组件的目录：组件名、分类与 API 数据（build/api.ts，组件演练场用） */
declare module 'virtual:api-catalog' {
  const catalog: {
    name: string;
    category: string;
    api: import('@vue-tsx-pro/ui').ComponentApi;
  }[];
  export default catalog;
}

/** 组件文档页的清单（build/pages.ts） */
declare module 'virtual:doc-pages' {
  const pages: import('./site/types').ComponentPageEntry[];
  export default pages;
}
