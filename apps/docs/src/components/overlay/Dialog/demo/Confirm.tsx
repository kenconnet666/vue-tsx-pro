import { LogOut, Trash2, Undo2 } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { AlertDialog, Button, Flex, Small, useConfirm } from '@zerodep-dev/vue-tsx-pro-ui';

export default _component(() => {
  let open = _state(false);
  let result = _state('');
  const confirm = useConfirm();

  // onConfirm 返回 Promise 时确认按钮显示加载中，完成后才关闭；失败时保持打开
  const remove = () =>
    new Promise<void>((resolve) =>
      setTimeout(() => {
        result = '项目“官网改版”已删除';
        resolve();
      }, 1000),
    );

  const signOut = async () => {
    const ok = await confirm({
      title: '退出登录？',
      description: '未保存的草稿会保留在这台设备上。',
      confirmText: '退出',
    });
    result = ok ? '已退出登录' : '取消了退出';
  };

  // 要填理由：得到填的理由，取消时是 null
  const reject = async () => {
    const reason = await confirm({
      title: '驳回“10 月差旅报销”？',
      tone: 'danger',
      confirmText: '驳回',
      reason: {
        label: '驳回理由',
        required: true,
        description: '申请人会在通知里看到这段理由',
        placeholder: '如：缺少 10 月 12 日的酒店发票',
        maxlength: 200,
      },
    });
    result = reason === null ? '取消了驳回' : `已驳回：${reason}`;
  };

  return () => (
    <Flex direction="column" gap="md" align="start">
      <Flex gap="sm" wrap>
        <Button variant="soft" tone="danger" icon={Trash2} onClick={() => (open = true)}>
          删除项目
        </Button>
        <Button variant="outline" tone="neutral" icon={LogOut} onClick={() => void signOut()}>
          退出登录（useConfirm）
        </Button>
        <Button variant="outline" tone="danger" icon={Undo2} onClick={() => void reject()}>
          驳回（填理由）
        </Button>
      </Flex>
      <Small tone="muted">{result || '还没有操作'}</Small>
      <AlertDialog
        _open={open}
        tone="danger"
        title="删除项目“官网改版”？"
        description="项目里的 48 个文件和全部评论会一起删除，无法恢复。"
        confirmText="删除"
        onConfirm={remove}
      />
    </Flex>
  );
});
