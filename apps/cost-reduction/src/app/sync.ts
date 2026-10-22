/**
 * 页面之间的“数据变了”信号：在收件箱、卡的详情里认领、处理、退回之后发一次，顶栏的待办数、通知、
 * 收件箱的列表各自重新取。接上后端推送（SSE / WebSocket）后由推送触发同一个信号
 */
import { shallowRef } from 'vue';

const version = shallowRef(0);

/** 流程的数据变了：认领、处理、退回、指定、催办之后调用 */
export function announceWorkflowChange(): void {
  version.value++;
}

/** 流程数据的版本：放进 useRequest 的 params，变了就重新取 */
export const workflowVersion = (): number => version.value;
