import { Sparkles } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Alert, Button, Flex } from '@vue-tsx-pro/ui';

export default _component(() => {
  let dismissed = _state(false);
  let retrying = _state(false);
  return () => (
    <Flex direction="column" gap="sm">
      <Alert variant="soft" tone="accent" icon={Sparkles} title="soft（默认）">
        浅色底，没有描边。
      </Alert>
      <Alert variant="surface" tone="accent" title="surface">
        浅色底加描边：放在白色卡片里也看得清边界。
      </Alert>
      <Alert variant="outline" tone="accent" title="outline">
        只有描边：信息不那么紧急时用。
      </Alert>
      <Alert
        variant="surface"
        tone="danger"
        title="保存失败"
        loading={retrying}
        action={
          <Button
            size="sm"
            variant="soft"
            tone="danger"
            loading={retrying}
            onClick={() => {
              retrying = true;
              setTimeout(() => (retrying = false), 1500);
            }}
          >
            重试
          </Button>
        }
      >
        服务器暂时不可用。loading 时图标换成旋转指示。
      </Alert>
      {!dismissed && (
        <Alert tone="info" title="可以关闭" onClose={() => (dismissed = true)}>
          写了 onClose 就有关闭按钮。
        </Alert>
      )}
    </Flex>
  );
});
