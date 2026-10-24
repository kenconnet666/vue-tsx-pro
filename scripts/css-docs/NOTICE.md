# CSS 注释数据的来源

`generate.mjs` 用以下数据生成 `packages/tsx/src/styles/documented.ts`（各 CSS 属性的中文注释）。

| 内容                                      | 来源                                                                                                                           | 许可       |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| 属性集合、伪元素、值类型、数字单位规则    | [StyleX](https://github.com/facebook/stylex) 0.19.1 的类型声明，收录在 `packages/tsx/src/styles/css-properties.ts`             | MIT        |
| 初始值、是否继承、标准状态、MDN 链接      | [mdn-data](https://github.com/mdn/data)                                                                                        | CC0-1.0    |
| 浏览器支持（Baseline）                    | [web-features](https://github.com/web-platform-dx/web-features)                                                                | Apache-2.0 |
| 中文说明、常用值、适用场景（`docs.json`） | 本仓库维护；起点是 [zerodep-js](https://github.com/kenconnet666/zerodep-js) 的 `scripts/css-author-docs.json`（同一作者，MIT） | MIT        |

约定：

- 中文说明用自己的话写，不复制 MDN 正文（MDN 正文为 CC-BY-SA），只通过 `@see` 链接到 MDN。
- 事实字段（初始值、继承、Baseline）只从数据包读取，不在 `docs.json` 里手写。
- StyleX 升级后运行 `pnpm css-docs`：新增的属性缺少中文说明时脚本报错并列出属性名，补进 `docs.json` 即可。
