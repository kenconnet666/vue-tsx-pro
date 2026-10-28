/**
 * 引擎的错误：带代号，HTTP 适配器按代号给状态码，界面按代号给提示
 *
 *   try { await engine.run(command, actor) } catch (error) { if (error instanceof FlowError && error.code === 'already-handled') … }
 */

/** 错误的代号 */
export type FlowErrorCode =
  /** 找不到流程、实例、待办 */
  | 'not-found'
  /** 待办已经处理过、取消了，或被别人认领了 */
  | 'already-handled'
  /** 实例已经结束或暂停 */
  | 'instance-not-active'
  /** 这个人不能做这件事：不是候选人、不是发起人、没有权限 */
  | 'forbidden'
  /** 命令的参数不对：结果不在节点上、意见必填…… */
  | 'invalid-input'
  /** 流程定义有错（发布时校验不过，或推进时选不出边） */
  | 'invalid-definition'
  /** 处理人解析不出来，且节点要求报错 */
  | 'no-assignee'
  /** 守卫拒绝了这次提交 */
  | 'guard-rejected'
  /** 接入方的扩展（同步的动作）出错 */
  | 'extension-failed';

/** 引擎的错误 */
export class FlowError extends Error {
  readonly code: FlowErrorCode;
  /** 附加信息：校验问题、哪个字段…… */
  readonly details: Readonly<Record<string, unknown>>;

  constructor(code: FlowErrorCode, message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.name = 'FlowError';
    this.code = code;
    this.details = details;
  }
}
