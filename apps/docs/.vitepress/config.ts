import { defineConfig } from 'vitepress';
import { vueTsxPro, workspaceSource } from '@vue-tsx-pro/tsx/vite';

export default defineConfig({
  lang: 'zh-CN',
  title: 'vue-tsx-pro',
  description: '更自然的 Vue TSX 写法',
  themeConfig: {
    nav: [{ text: '指南', link: '/' }],
  },
  vite: {
    // 演示代码与 Markdown 中引用的 .tsx 走同一套预设
    plugins: [workspaceSource(), ...vueTsxPro()],
  },
});
