/// <reference types="vite/client" />

// vue-jsx 的宏在编译期替换；这里只为类型检查提供声明（完整类型需 vue-jsx/volar + ts-macro）
declare function defineStyle(style: string, options?: { scoped?: boolean }): Record<string, string>
