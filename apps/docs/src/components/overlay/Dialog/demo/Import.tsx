import { Contact } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Button, Dialog, Flex, Progress, Small } from '@zerodep-dev/vue-tsx-pro-ui';
import { onBeforeUnmount } from 'vue';

const TOTAL = 1280;

export default _component(() => {
  let open = _state(false);
  let done = _state(0);
  let result = _state('');
  let timer: ReturnType<typeof setInterval> | undefined;

  const stop = () => clearInterval(timer);
  const start = () => {
    done = 0;
    open = true;
    timer = setInterval(() => {
      done = Math.min(TOTAL, done + 96);
      if (done < TOTAL) return;
      stop();
      result = `导入了 ${TOTAL} 位联系人`;
      setTimeout(() => (open = false), 400);
    }, 150);
  };
  const cancel = () => {
    stop();
    open = false;
    result = `取消了，已导入 ${done} 位`;
  };
  onBeforeUnmount(stop);

  return () => (
    <Flex direction="column" gap="md" align="start">
      <Button icon={Contact} onClick={start}>
        导入通讯录
      </Button>
      <Small tone="muted">{result || '导入期间点遮罩不会关闭，也没有右上角的关闭按钮'}</Small>
      <Dialog
        _open={open}
        title="正在导入通讯录"
        description="完成后自动关闭；可以随时取消，已导入的联系人会保留。"
        closable={false}
        dismissible={false}
        onClose={stop}
        footer={
          <Button variant="soft" tone="neutral" onClick={cancel}>
            取消导入
          </Button>
        }
      >
        <Progress
          value={done}
          max={TOTAL}
          label="导入进度"
          valueLabel={`${done} / ${TOTAL}`}
          valueText={(value, max) => `已导入 ${String(value)} / ${String(max)} 位`}
        />
      </Dialog>
    </Flex>
  );
});
