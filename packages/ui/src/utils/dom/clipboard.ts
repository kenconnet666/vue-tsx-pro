/**
 * 复制到剪贴板，带“刚复制过”的状态（按钮显示对勾、读屏播报“已复制”），过一会儿自动复原。
 *
 *   const clipboard = useClipboard();
 *   <IconButton icon={clipboard.copied ? Check : Copy} onClick={() => void clipboard.copy(code)} />
 */
import { onScopeDispose, shallowRef } from 'vue';

/** useClipboard 的选项 */
export interface ClipboardOptions {
  /** copied 保持多久（毫秒）后复原，默认 2000 */
  timeout?: number;
}

/** useClipboard 的返回值 */
export interface ClipboardState {
  /** 刚复制成功，timeout 后复原 */
  readonly copied: boolean;
  /** 上一次复制失败的原因（不安全的上下文、用户拒绝了权限）；成功后清空 */
  readonly error: unknown;
  /** 复制文字，返回是否成功 */
  copy(text: string): Promise<boolean>;
}

/** 复制与复制状态（在 setup 里调用） */
export function useClipboard({ timeout = 2000 }: ClipboardOptions = {}): ClipboardState {
  const copied = shallowRef(false);
  const error = shallowRef<unknown>(undefined);
  let timer: ReturnType<typeof setTimeout> | undefined;
  onScopeDispose(() => clearTimeout(timer));

  return {
    get copied() {
      return copied.value;
    },
    get error() {
      return error.value;
    },
    async copy(text) {
      clearTimeout(timer);
      try {
        await navigator.clipboard.writeText(text);
      } catch (reason) {
        copied.value = false;
        error.value = reason;
        return false;
      }
      error.value = undefined;
      copied.value = true;
      timer = setTimeout(() => (copied.value = false), timeout);
      return true;
    },
  };
}
