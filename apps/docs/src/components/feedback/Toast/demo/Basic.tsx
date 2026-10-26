import { Trash2, Upload } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Button, createToaster, Flex, Toaster, type StatusTone } from '@zerodep-dev/vue-tsx-pro-ui';

// 应用里一般在单独的 toaster.ts 里创建一次，组件内外都能导入；这里只给这个示例用
const toaster = createToaster();

const messages: [StatusTone, string, string][] = [
  ['success', '已保存', '改动已同步到所有设备。'],
  ['info', '有新版本', '刷新页面即可使用 2.4.0。'],
  ['warning', '存储空间不足', '还剩 2 GB，请清理回收站。'],
  ['danger', '发送失败', '对方的邮箱地址无效。'],
];

const upload = () =>
  new Promise<string>((resolve, reject) =>
    setTimeout(
      () => (Math.random() > 0.3 ? resolve('report.pdf') : reject(new Error('网络中断'))),
      1800,
    ),
  );

export default _component(() => () => (
  <Flex direction="column" gap="md">
    <Flex gap="sm" wrap>
      {messages.map(([tone, title, description]) => (
        <Button
          key={tone}
          variant="soft"
          tone={tone}
          size="sm"
          onClick={() => toaster.show({ tone, title, description })}
        >
          {title}
        </Button>
      ))}
    </Flex>
    <Flex gap="sm" wrap>
      <Button
        size="sm"
        variant="surface"
        tone="neutral"
        icon={Trash2}
        onClick={() => {
          const id = toaster.show({
            title: '已删除 3 个文件',
            action: (
              <Button
                size="sm"
                variant="soft"
                onClick={() => {
                  toaster.dismiss(id);
                  toaster.show({ tone: 'success', title: '已恢复' });
                }}
              >
                撤销
              </Button>
            ),
          });
        }}
      >
        删除（可撤销）
      </Button>
      <Button
        size="sm"
        variant="surface"
        tone="neutral"
        icon={Upload}
        onClick={() =>
          void toaster
            .promise(upload(), {
              loading: { title: '正在上传 report.pdf' },
              success: (name) => ({ title: `${name} 上传完成` }),
              error: (error) => ({ title: '上传失败', description: String(error) }),
            })
            .catch(() => undefined)
        }
      >
        上传（promise）
      </Button>
    </Flex>
    <Toaster controller={toaster} placement="bottom-end" />
  </Flex>
));
