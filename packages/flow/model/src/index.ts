/**
 * 流程引擎的模型包：定义的类型、条件、值、图、选边、校验、表单权限、差异，前端（设计器、审批面板）与引擎共用，不依赖 vue 与 easy-query。
 * 设计见 docs/decisions/0001-design.md。按职责分在三个文件夹：
 *
 * - definition/：流程定义本身——类型（definition）、格式版本（schema）、在代码里写（define）、图（graph）、分叉与汇合（gateway-pairs）、
 *   校验（validate）、设计器的编辑函数（edit）、两个版本的差异（diff）
 * - routing/：推进时怎么取值、比较、选边——值（values）、条件树（condition）、选边与连线的副作用（routing）
 * - form/：单据——字段清单（manifest）、值的检查（field-values）、清单的校验（validate-manifest）、字段在节点上的权限与收提交（access）
 *
 * 根目录：业务错误码（errors）、流程即 TS 工程（project）。
 */
export * from './definition/definition.ts';
export * from './definition/schema.ts';
export * from './definition/define.ts';
export * from './definition/graph.ts';
export * from './definition/gateway-pairs.ts';
export * from './definition/validate.ts';
export * from './definition/edit.ts';
export * from './definition/diff.ts';
export * from './routing/values.ts';
export * from './routing/condition.ts';
export * from './routing/routing.ts';
export * from './form/manifest.ts';
export * from './form/field-values.ts';
export * from './form/validate-manifest.ts';
export * from './form/access.ts';
export * from './errors.ts';
export * from './project.ts';
