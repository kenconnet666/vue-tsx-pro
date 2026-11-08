/**
 * 顶栏的通知铃铛（组件库的 NotificationCenter）：引擎的站内信箱（engine.notifications），按时间看“发生了什么”——
 * 到了、退回、催办、快到期、超时、抄送、结束。要办的东西按格子分在工作台表格的页签里（parts/boxes），这里不再分类。
 * 数据变了、换了身份重取；点一条标为已读并去那张单——待办类的去工作台的那份待办，抄送去“抄送我的”，结束去“我发起的”。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import type { NotificationView } from '@zerodep-dev/flow-ts-engine';
import type { NotificationItem } from '@zerodep-dev/vue-tsx-pro-ui/patterns';
import { NotificationCenter } from '@zerodep-dev/vue-tsx-pro-ui/patterns';
import { watch } from 'vue';
import { useFlowCenter } from '../runtime/center';
import { noticeText } from './labels';
import { showError } from './toaster';

/** 点一条去哪 */
function hrefOf(notice: NotificationView): string {
  const instance = `instance=${notice.instanceId}`;
  if (notice.event === 'cc') return `/flow/work?box=cc&${instance}`;
  if (notice.event === 'finished') return `/flow/work?box=started&${instance}`;
  return `/flow/work?box=todo&${instance}${notice.workItemId ? `&item=${notice.workItemId}` : ''}`;
}

export const NotificationBell = _component(() => {
  const center = useFlowCenter();
  let notices = _state.raw<readonly NotificationView[]>([]);

  watch(
    () => [center.state.revision, center.state.actor] as const,
    async () => {
      try {
        notices = await center.client.notifications.list({ limit: 50 });
      } catch (error) {
        showError(error);
      }
    },
    { immediate: true },
  );

  const items = (): NotificationItem[] =>
    notices.map((notice) => {
      const text = noticeText(notice);
      return {
        id: String(notice.id),
        title: text.title,
        description: notice.message ?? text.description,
        time: notice.createdAt.toISOString(),
        read: notice.readAt !== null,
        href: hrefOf(notice),
        ...(text.tone ? { tone: text.tone } : {}),
      };
    });

  return () => (
    <NotificationCenter
      items={items()}
      now={center.state.now.getTime()}
      onRead={(ids) => void center.client.notifications.read(ids.map(Number)).catch(showError)}
    />
  );
});
