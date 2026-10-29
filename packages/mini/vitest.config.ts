import { defineConfig } from 'vitest/config';
import { vueTsxPro, workspaceSource } from '@zerodep-dev/vue-tsx-pro-tsx/vite';

// 组件库按源码编译，测真实组件在小程序节点树上的更新。运行时本身不碰 DOM；
// 用 happy-dom 只是让模块按客户端转换（node 环境会按 SSR 转换，组件多出服务端渲染的登记）
export default defineConfig({
  plugins: [workspaceSource(), ...vueTsxPro()],
  test: { name: 'mini', environment: 'happy-dom' },
});
