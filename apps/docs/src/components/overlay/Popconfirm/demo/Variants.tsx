// 色调与图标、位置与箭头、取消回调
import { Archive, Send, Undo2 } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Button, Flex, Popconfirm, Small } from '@vue-tsx-pro/ui';

export default _component(() => {
  let last = _state('');
  return () => (
    <Flex direction="column" gap="md">
      <Flex gap="sm" wrap>
        <Popconfirm
          title="撤回这次提交？"
          description="撤回后审批流程回到草稿，审批人的意见会保留。"
          confirmText="撤回"
          onConfirm={() => void (last = '已撤回')}
          onCancel={() => (last = '取消了撤回')}
          trigger={(props) => (
            <Button {...props} variant="outline" tone="neutral" icon={Undo2}>
              撤回（warning）
            </Button>
          )}
        />
        <Popconfirm
          title="发送给全部 248 位客户？"
          tone="accent"
          icon={Send}
          confirmText="发送"
          placement="bottom"
          arrow
          onConfirm={() => void (last = '已发送')}
          onCancel={() => (last = '取消了发送')}
          trigger={(props) => (
            <Button {...props} icon={Send}>
              群发（accent、箭头）
            </Button>
          )}
        />
        <Popconfirm
          title="归档这个项目？"
          icon={false}
          tone="neutral"
          confirmText="归档"
          placement="right"
          onConfirm={() => void (last = '已归档')}
          onCancel={() => (last = '取消了归档')}
          trigger={(props) => (
            <Button {...props} variant="soft" tone="neutral" icon={Archive}>
              归档（不显示图标）
            </Button>
          )}
        />
      </Flex>
      <Small tone="muted" aria-live="polite">
        {last || '点按钮试试；点外面或按 Esc 等于取消'}
      </Small>
    </Flex>
  );
});
