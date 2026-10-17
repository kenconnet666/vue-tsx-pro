# 探针

`RESEARCH.md` 中各项结论的可运行证据。

```bash
pnpm install      # pnpm 12；自动应用 patches/ 中的 vue-jsx 宏补丁（见 pnpm-workspace.yaml）
pnpm test         # 组件、StyleX、Ref 容器坑、上游已知问题，共 13 项
pnpm typecheck    # 只应在 types-probe/usage.tsx 标注“应报错”的 3 行报错
pnpm build        # 生产构建，检查 dist/assets/*.css 中的 StyleX 输出
```

| 目录 | 内容 |
| --- | --- |
| `src/component.ts` | 推荐的组件边界：vue-jsx defineComponent + children 映射 |
| `src/Toggle.tsx` `src/Card.tsx` `src/TextField.tsx` | 三种典型组件写法 |
| `src/main.tsx` | 组合使用示例，可 `pnpm vite` 在浏览器里看 |
| `test/` | 运行时探针 |
| `types-probe/` | 类型探针 |
| `patches/` | 宏补丁，上游合入后删除 |
