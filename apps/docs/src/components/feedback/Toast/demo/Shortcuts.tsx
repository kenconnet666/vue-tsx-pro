import { Download, RefreshCw, Save } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Button, createToaster, Flex, Small, Toaster } from '@vue-tsx-pro/ui';

const toaster = createToaster();

export default _component(() => {
  let log = _state<string[]>([]);
  const record = (line: string) => (log = [line, ...log].slice(0, 4));

  /** 导出：先放一条“进行中”，完成后用同一个 id 换成结果 */
  function exportReport() {
    toaster.loading('正在导出 10 月对账单', { id: 'export' });
    setTimeout(
      () =>
        toaster.success('对账单已导出', {
          id: 'export',
          description: '共 1,284 行，已保存到下载目录',
          onClose: (reason) => record(`导出通知关闭：${reason === 'timeout' ? '到时' : '手动'}`),
        }),
      1500,
    );
  }

  return () => (
    <Flex direction="column" gap="md">
      <Flex gap="sm" wrap>
        <Button
          size="sm"
          variant="soft"
          tone="success"
          icon={Save}
          // 连点几次也只有一条：同一个 id 换掉原来的那条并重新计时
          onClick={() => toaster.success('草稿已保存', { id: 'draft' })}
        >
          保存草稿（连点试试）
        </Button>
        <Button size="sm" variant="surface" tone="neutral" icon={Download} onClick={exportReport}>
          导出（loading → success）
        </Button>
        <Button
          size="sm"
          variant="soft"
          tone="danger"
          icon={RefreshCw}
          onClick={() =>
            toaster.error('同步失败', {
              id: 'sync',
              description: '服务器暂时不可用，稍后会自动重试',
              onClose: (reason) =>
                record(`同步通知关闭：${reason === 'timeout' ? '到时' : '手动'}`),
            })
          }
        >
          同步失败
        </Button>
      </Flex>
      <Small tone="muted" aria-live="polite">
        {log.length ? log.join('；') : 'onClose 的记录显示在这里'}
      </Small>
      <Toaster controller={toaster} placement="bottom-end" />
    </Flex>
  );
});
