/** 流程中心的通知：处理成功、出错的提示（外壳里放一个 Toaster 显示它） */
import { createToaster } from '@zerodep-dev/vue-tsx-pro-ui';
import { FlowError } from '@zerodep-dev/flow-ts-engine/client';

export const toaster = createToaster();

/** 引擎的错误提示成通知：表单的问题列出第一处 */
export function showError(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  toaster.show({
    tone: 'danger',
    title: error instanceof FlowError && error.code === 'invalid-input' ? '单据没填好' : '没有办成',
    description: message,
  });
}
