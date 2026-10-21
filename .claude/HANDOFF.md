# 交接（2026-10-21）

换电脑继续时先读这份，再读 `ROADMAP.md`。

## 当前状态

- 分支 `master`，已推送到 origin，最新提交是图表 P2 前半与本文件。
- CI：`b4d38ea` 全绿；这次推送的结果还没看，开工前先 `gh run list --branch master --limit 3` 确认。
- 工作区干净，没有未提交的改动、没有在跑的子会话。

## 路线图里还剩的（按顺序做，不必再问）

1. **图表 P2**：TimelineChart（Unovis Timeline，放在 XYContainer 里）、GraphChart（Unovis Graph，布局按需懒加载）。
   - 照 SankeyChart/ChordChart 的结构：数据类型、`useSingleChart`（`charts/single.tsx`）或 XYChart、`ChartFrame`（`charts/frame.tsx`）提供图例、空与加载状态、读屏数据表。
   - `--vis-*` 主题变量映射到 tokens；Unovis 的类型与选项先查 `.claude/reports/unovis-api.md` 和 `node_modules/.pnpm/@unovis+ts@1.7.1/.../components/<name>/config.d.ts`。
   - 导出加到 `packages/ui/src/charts/index.ts`，单元测试加在 `charts/.test/charts.test.tsx`，文档页放在 `apps/docs/src/components/charts/<Name>/`（order 接着 7 往后排）。
2. **图表 P3**：TopoJSON 地图、LeafletMap、BulletLegend 等。
3. **§7 目录整理**：零散文件按职责收进文件夹，删掉无人调用的代码（见 `.claude/reports/reuse-audit.md`）。整理和功能改动分开提交。
4. **§8**：评估把每个文件的三四次 Babel（符文、tokens、StyleX、vue-jsx）合并成一次解析。先给方案，不直接动。

## 工作约定

这些写在原电脑的 Claude 记忆里，新电脑没有，所以照抄在这里。

- 用户要求按目标模式持续执行路线图，不用逐项询问。修根因，顺手删死代码；上层组件必须用基础设施（ChartFrame、mergePartProps、tokens 等）。
- 每轮结束提交，然后直接 `git push origin master`。推送前看上一次 CI；推完不等 CI，下次推送前再查。
- 本地只跑相关的检查（相关目录的 vitest、`tsc -p .`），全量交给 CI；长命令放后台。
- `pnpm check` 必须看退出码：`pnpm check >/dev/null 2>&1 && echo ok`。用 grep 过滤会把失败藏起来，以前因此漏推过注释检查的失败。
- 每个导出的字段都要有 JSDoc（doc-comments 检查）。中文排版用 `pnpm text:check --fix` 修，修完再跑 Prettier。
- 多节点组件的每个节点都要有 `propsXxx`，用 mergePartProps 合并。图标用 `@lucide/icons`，不手画 SVG。
- 加载反馈：小组件用独立动效，只有容器占位才用骨架。
- 示例要饱满，占满宽度；相关组件可以合在一页；Examples 两列不重新平衡；卡片不要点状背景。
- 页面在用户的 Chrome（Claude in Chrome）里宽屏验证；文档 dev 服务在 5174（`.claude/launch.json` 的 `docs`）。
- 回复用中文；commit message 用中文，结尾加 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`。
- 密钥（`GITHUB_TOKEN`、`CONTEXT7_API_KEY`）放在用户级环境变量里，配置用 `${VAR}` 引用，绝不写进文件或提交。

## 容易踩的坑

- TSX 符文：`_bind(get, set)` 的 get 必须是行内函数字面量；只要初始值时用 `_untrack`。
- 和原生 div 属性重名的 prop 要改名或 Omit（`hidden`、`onToggle`、`color`、`onLoad`、`onError` 都踩过）。
- 测试环境是 happy-dom，没有 CSS：样式用 `hasStyles` 断言。Unovis 画的 svg 也带 `role="figure"`，取外层要用 `:scope > [role="figure"]`。
- 不要在 bash heredoc 或 `node -e` 里写模板字符串或反引号，会被转义坏。这类内容用 Write/Edit。这台机器也没有 python。
- 改了 `apps/docs/build/api.ts` 或 `vite.config.ts`，Vite 会在进程内重启；新加的文档页可能要刷新一次才出现。Chrome 窗口被遮住时截图会被节流。
- a11y 浏览器测试（`apps/docs/src/test/a11y.browser.test.ts`）按主题和分类拆分；新加的 Shiki 语言、重依赖要加进 `optimizeDeps`，否则 CI 中途会重载。
