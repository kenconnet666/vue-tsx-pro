// 命令式的小表单对话框：退回要写原因（必填、至少 6 个字），改派从名单里选；提交失败时对话框留着
import { UserRoundCog, Undo2 } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Button, Flex, Small } from '@vue-tsx-pro/ui';
import { useFormDialog } from '@vue-tsx-pro/ui/patterns';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default _component(() => {
  const prompt = useFormDialog();
  let result = _state('');

  async function giveBack() {
    const values = await prompt({
      title: '退回收件箱',
      description: '退回后这一条回到岗位收件箱，你不能再认领它。',
      confirmText: '退回',
      tone: 'danger',
      fields: [
        {
          name: 'reason',
          label: '原因',
          type: 'textarea',
          required: true,
          maxlength: 200,
          validate: (value) => (value.length < 6 ? '至少写 6 个字，说清为什么' : null),
        },
      ],
      onSubmit: () => wait(600),
    });
    result = values ? `已退回：${values.reason}` : '取消了';
  }

  async function reassign() {
    const values = await prompt({
      title: '指定承办人',
      fields: [
        {
          name: 'who',
          label: '承办人',
          type: 'select',
          required: true,
          options: [
            { value: 'E50913', label: '王晴' },
            { value: 'E50377', label: '唐可' },
          ],
        },
        { name: 'note', label: '留言', placeholder: '可以不写' },
      ],
      confirmText: '指定',
    });
    result = values ? `已指定 ${values.who}${values.note ? `：${values.note}` : ''}` : '取消了';
  }

  return () => (
    <Flex direction="column" gap="md" align="start">
      <Flex gap="sm" wrap>
        <Button variant="outline" tone="danger" icon={Undo2} onClick={() => void giveBack()}>
          退回收件箱
        </Button>
        <Button variant="outline" icon={UserRoundCog} onClick={() => void reassign()}>
          指定承办人
        </Button>
      </Flex>
      <Small tone="muted">{result || '点一个按钮'}</Small>
    </Flex>
  );
});
