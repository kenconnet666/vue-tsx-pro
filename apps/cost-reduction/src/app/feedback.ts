/**
 * 全局的提示：各页共用一个 Toaster（外壳里渲染），保存成功、操作失败都从这里提示。
 * 接口出错时显示后端给的说明（响应体的 message），没有时显示请求本身的错误
 */
import { createToaster, HttpError } from '@vue-tsx-pro/ui';

/** 全局的提示 */
export const toaster = createToaster();

/** 出错的说明：后端给的 message 优先 */
export function errorMessage(error: unknown): string {
  if (error instanceof HttpError) {
    const data = error.data as { message?: unknown } | undefined;
    if (typeof data?.message === 'string') return data.message;
  }
  return error instanceof Error ? error.message : String(error);
}

/** 提示一个失败的操作 */
export function notifyError(title: string, error: unknown): void {
  toaster.show({ title, description: errorMessage(error), tone: 'danger', important: true });
}
