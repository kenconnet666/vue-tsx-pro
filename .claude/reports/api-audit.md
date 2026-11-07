# 组件 API 审计（2026-11-08）

数据：文档站构建出的 `/spec/components.json`（267 个组件、934 个属性名）。脚本按四类找可疑处：正反两种开关、常见同义词、
只差大小写、编辑距离 1–2 的近似名。结论：没有要改的命名；下面是看过的几组和留着的理由，以后加属性时照着用。

## 同义而分开用的（语义不同，保留）

| 属性 | 用在 | 含义 |
| --- | --- | --- |
| `closable` | Dialog、Drawer、FormDialog、CommandPalette | 标题行的关闭按钮 |
| `dismissible` | 同上 | 点遮罩关闭（Esc 仍可关） |
| `clearable` | 输入类（18 个） | 输入框里的清除按钮 |
| `hideDelay` | ScrollArea、OverlayScrollbar、PageScrollbar | 滚动条停止后淡出 |
| `delay` / `closeDelay` | Tooltip、HoverCard | 悬停打开 / 离开关闭 |
| `maxTagCount` | Select、TreeSelect、PeoplePicker、PageSizeSelect、SelectedTags | 触发框里的标签数，可写 `'responsive'` |
| `maxItems` | Breadcrumbs | 超过时折叠中间几级 |
| `maxVisible` | Timeline | 只显示最新几项，其余收起 |
| `onPick` | Listbox、Calendar 一类 | 选了一个值（选择器据此关弹层） |
| `onAction` | MenuItem、CommandPalette、ColumnMenuButton | 执行了一项 |
| `onSelect` | ItemListItem | 整条可点（主从视图里选中） |
| `onItemClick` | 图表、通知等 12 个 | 点了数据里的一项（下钻） |
| `format` / `valueFormat` | 单个数值（Stat、NumberField…） / 图表的数值轴 | 图表里还有 indexFormat 等，故加前缀 |
| `getLabel` / `toOption` | 树形的取值函数 / 任意数据转成选项 | 前者配 getKey、getChildren |

## 约定（新属性照此命名）

- 开关一律正向 `showXxx`（showToday、showTotal…）；只有默认显示、要关掉时才用 `hideXxx`（hideEmpty）。
- 可绑定的状态用 `_xxx`（`_value`、`_open`、`_expanded`…），内部视图组件（DataTableView、DataTableRow）用不带下划线的同名受控属性。
- 部件属性 `propsXxx`，部件名（`data-part`）是同名的小驼峰（scripts/structure/part-names.mjs 检查）。
- “超过 N 个就折叠”按对象起名：标签 `maxTagCount`、层级 `maxItems`、列表项 `maxVisible`。
