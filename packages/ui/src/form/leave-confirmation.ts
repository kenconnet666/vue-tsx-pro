/**
 * 未保存离开的提醒：read() 为 true 时——
 *   - 关闭标签页、刷新、跳到别的网站前，浏览器问一下（beforeunload；只显示浏览器自己的固定文案）；
 *   - 站内跳转（路由适配有 beforeLeave 时，如 vueRouterAdapter）先弹确认对话框，选“离开”才走。
 *
 *   useLeaveConfirmation(() => form.dirty && !form.submitting);
 */
import { onScopeDispose } from 'vue';
import { useConfig, useLang } from '../config/context';
import { useConfirm } from '../overlay/AlertDialog';
import { useEventListener } from '../utils/dom/event-listener';

/** useLeaveConfirmation 的选项：站内跳转时确认对话框的文字，默认取语言包 */
export interface LeaveConfirmationOptions {
  /** 标题，默认“离开这个页面？” */
  title?: string;
  /** 说明，默认“有未保存的修改，离开后会丢失。” */
  description?: string;
}

/** 有未保存的修改时拦住离开（在 setup 里调用，组件卸载时自动解除） */
export function useLeaveConfirmation(
  read: () => boolean,
  options: LeaveConfirmationOptions = {},
): void {
  // 只在需要时注册：注册了 beforeunload 的页面进不了往返缓存（bfcache）
  useEventListener(
    () => (read() ? window : null),
    'beforeunload',
    (event) => event.preventDefault(),
  );

  const router = useConfig().router;
  if (!router?.beforeLeave) return;
  const lang = useLang();
  const confirm = useConfirm();
  const remove = router.beforeLeave(
    () =>
      !read() ||
      confirm({
        title: options.title ?? lang.leaveTitle,
        description: options.description ?? lang.leaveDescription,
        confirmText: lang.leaveConfirm,
        tone: 'danger',
      }),
  );
  onScopeDispose(remove);
}
