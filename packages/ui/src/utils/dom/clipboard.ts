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
        await writeText(text);
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

/**
 * 写入剪贴板。Clipboard API 只在安全上下文（https、localhost）里有：内网常见的 http 部署没有它，
 * 这时退回 execCommand('copy')（已废弃，但各浏览器仍支持；同 VueUse useClipboard 的 legacy）
 */
async function writeText(text: string) {
  if (navigator.clipboard) return navigator.clipboard.writeText(text);
  if (!copyBySelection(text))
    throw new Error('浏览器不允许复制：不是安全上下文，execCommand 也失败了');
}

/** 选中一个看不见的 textarea 再执行复制；之后焦点还给原来的元素（复制按钮） */
function copyBySelection(text: string): boolean {
  const active = document.activeElement as HTMLElement | null;
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.readOnly = true;
  textarea.style.cssText = 'position:fixed;inset-block-start:0;opacity:0;pointer-events:none';
  // 模态对话框打开时页面其余部分是 inert 的，放在 body 上选不中：放进焦点所在的对话框、弹层里
  (active?.closest('dialog, [popover]') ?? document.body).append(textarea);
  // select() 不一定把焦点移过去（MDN），先聚焦，复制的才是它的选区
  textarea.focus({ preventScroll: true });
  textarea.select();
  try {
    return document.execCommand('copy');
  } finally {
    textarea.remove();
    active?.focus({ preventScroll: true });
  }
}
