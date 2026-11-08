# 0003 待办上的动作插件化（2026-11-08）

## 1. 形状

每个动作是一个插件（`engine/src/operations.ts` 的 `WorkItemOperation`）：

- `name`、`label`、`tone`：叫什么、按钮的色调；
- `fields(scope)`：要填什么（选人、选多人、文字、多行文字、单选），前端照着渲染对话框；
- `available(scope)`：这个人此刻能不能做；`refusal(scope)`：不能做时报什么（默认待办办完了是 `already-handled`，其余 `forbidden`）；
- `run(context, input)`：做什么。实例已锁住、待办重读过；`context` 带推进现场、事务、`cancel`（取消这份）、`finish`（按某个结果处理完，同 complete）。

`scope` 是待办、节点、实例（锁住后的状态）、做事的人、他是不是候选人、实例上的全部待办。

- 命令：`{ type: 'operate', workItem, operation, input }`；`claim`、`transfer`、`reassign` 留作它的简写。
- 待办详情给 `operations`：这个人此刻能做的动作与字段；`claimable`、`completable` 留着（处理是选结果，不是动作）。
- 引擎选项 `operations` 加自定义的动作，同名的覆盖内置的。节点的 `allow` 按名字关掉某个动作（`allow.transfer: false`）。

## 2. 内置的动作

语义对齐 Java 版验证过的场景（`spec/scenarios` 的 purchase-collaboration、withdraw-step）。

| 动作                       | 谁能做                                 | 做什么                                                                                                                                                                                                                                  |
| -------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `claim` 认领               | 收件箱里的候选人                       | 落到自己；被别人或自己先认领了报 `already-handled`                                                                                                                                                                                      |
| `release` 放回收件箱       | 认领的人                               | 表示“不是我的”：退回收件箱，他从候选里排除（标记 `-user:编号`）                                                                                                                                                                         |
| `transfer` 转办            | 处理人、收件箱里的候选人、管理员       | 取消这份，给对方建一份（同会签组、同序号，`fromUser` 记从谁转来）                                                                                                                                                                       |
| `reassign` 改派            | 管理员                                 | 原地换人，不新建待办                                                                                                                                                                                                                    |
| `delegate` 委托            | 处理人                                 | 只加一个人的前加签：自己这份等，受托人选的结果记作意见，办完回到自己（`workItem.resumed`）                                                                                                                                              |
| `addSign` 加签             | 处理人（不在加签里）                   | 前加签：自己这份等，加签的人都办完回到自己；后加签：先给他们建排队的待办，自己选了结果时打开，结果挂着（`pendingOutcome`）等他们办完才生效，有人选了非通过的按他的走；并加签（只在会签节点）：加进会签组，一起算完成规则                |
| `withdrawStep` 撤回        | 办完这一份的人                         | 之后开出的待办都还开着、没人认领、没人动过时：取消它们，这一份重新打开（同一个编号），这一步改过的单据值恢复（处理时把原值记在 `workItem.completed` 事件里）；不能撤时报 `forbidden`                                                    |
| `assign` 指定承办人        | 收件箱的负责人（`designator`）、管理员 | 收件箱里过了 `unclaimed.after` 没人认领、`action: 'assignByManager'` 时，引擎问组织的 `inboxManager` 记下负责人（`workItem.unclaimed`），待办进他的“待我指定”（`query.designations`）；他指定后落到那个人（`assignment: 'designated'`） |
| `requestReassign` 申请改派 | 被指定的人                             | 写明原因，待办回到负责人的“待我指定”里（`awaitingDesignation`）；重新指定之前仍由他处理                                                                                                                                                 |
| `removeSign` 减签          | 原来那份的处理人                       | 取消选中的、还没办的加签（委托）待办（`workItem.signersRemoved`）；都减掉了，原来那份恢复，后加签的挂着的结果生效                                                                                                                       |

加签、委托的人（`parentItemId` 指向原来那份）只能选通过、否决一类的结果，不能退回；能转办自己那份，不能再加签、委托。

## 3. 其他命令与查询

- 催办（`remind`）：同一份待办一小时内只催一次（待办上记 `remindedAt`，带条件地更新），同 Java 版。
- 批量（`engine.runMany(commands, actor)`）：每条一个事务，各自成败，结果是 `{ ok: true, result }` 或 `{ ok: false, code, message }`。
- 管理员改单据数据（`changeData`）：只记真的变了的字段，`instance.dataChanged` 的 data 里每个字段一份改前、改后。
- 会签的 `votes` 规则（票签）：指定的人带 `weight`，同一结果的票数先达到 `votes` 的为准，都办完没达到按 `fallback`。
- 自定义节点（`type: 'x-名字'`）：扩展的 `nodes` 里注册，`arrive` 当场做完（按结果往下走、改变量）或 `waitFor` 停下来等事件，
  事件由 `engine.signal` 送来时调 `received`（不写时按事件带的结果走）；节点上除共同字段以外的属性原样给它。
- 自定义会签规则（`multi.complete: '名字'`）：扩展的 `countersign` 里注册，每有一个人处理完问一次，返回结果就结束、返回
  undefined 再等，都办完没结果按 `fallback`（没写时按最后这个人选的）。流程工程的 logic.ts 也能写这两类。
- 迁移版本（`migrate`，管理员）：正在用的节点按对应关系（同名的可以不写）换到新版本的节点，新版本里没有或类型不同时报
  `invalid-input`（`code: no-matching-node`）不迁；待办、作业、运行状态里的节点跟着改，记 `instance.migrated`。
- 提级是结果的一种（`kind: 'escalate'`），按提级连线走，不是动作。
- 已办、我发起的按流程、时间段筛（`ListFilter`：`processKey`、`from`、`to`）。

## 4. 表

待办加 `parentItemId`、`pendingOutcome`、`fromUser`、`designator`、`awaitingDesignation`、`weight`、`remindedAt` 七列；`assignment` 多一个 `designated`。

## 5. 之后

草稿（处理前暂存、发起前存草稿）要按单据的字段校验值，随表单模块（ROADMAP 26.4）做。
