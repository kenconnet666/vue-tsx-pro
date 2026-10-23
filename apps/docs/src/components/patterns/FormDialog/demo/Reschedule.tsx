// 申请调整计划日期：日期字段限定范围，原因从带说明的选项里选，“其他”时说明必填（跨字段校验）；推迟超过 30 天时提交被拒、对话框留着
import { CalendarClock } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Button, daysBetween, Flex, shiftIsoDate, Small } from '@vue-tsx-pro/ui';
import { useFormDialog } from '@vue-tsx-pro/ui/patterns';

const PLANNED = '2026-11-20';
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default _component(() => {
  const prompt = useFormDialog();
  let planned = _state(PLANNED);
  let result = _state('');

  async function reschedule() {
    const values = await prompt({
      title: '申请调整计划完成日期',
      description: `当前计划 ${planned}。提交后由项目经理审批，审批通过前仍按原计划考核。`,
      confirmText: '提交申请',
      size: 'md',
      fields: [
        {
          name: 'due',
          label: '新的完成日期',
          type: 'date',
          required: true,
          defaultValue: shiftIsoDate(planned, { days: 7 }),
          min: shiftIsoDate(planned, { days: 1 }),
          max: shiftIsoDate(planned, { days: 90 }),
          description: '只能推迟，最多 90 天',
        },
        {
          name: 'cause',
          label: '原因',
          type: 'select',
          required: true,
          options: [
            { value: 'supplier', label: '供应商交付延迟', description: '附上供应商的书面说明' },
            { value: 'design', label: '设计变更', description: '写明变更单号' },
            { value: 'test', label: '验证不通过', description: '需要重新试制' },
            { value: 'other', label: '其他', description: '在说明里写清楚' },
          ],
        },
        {
          name: 'note',
          label: '说明',
          type: 'textarea',
          maxlength: 300,
          placeholder: '选“其他”时必填',
          validate: (value, all) =>
            all.cause === 'other' && !value ? '原因选了“其他”，写一下具体情况' : null,
        },
      ],
      // 后端的规则：推迟超过 30 天要走分级审批，这里直接拒绝；拒绝时对话框留着，可以改日期再提交
      onSubmit: async (submitted) => {
        await wait(600);
        if (daysBetween(planned, submitted.due!) > 30) {
          result = '提交失败：推迟超过 30 天要走分级审批，改一下日期再提交';
          throw new Error('too late');
        }
      },
    });
    if (!values) {
      result = '取消了';
      return;
    }
    planned = values.due!;
    result = `已提交：推迟到 ${values.due}（${daysBetween(PLANNED, values.due!)} 天）`;
  }

  return () => (
    <Flex direction="column" gap="md" align="start">
      <Button variant="outline" icon={CalendarClock} onClick={() => void reschedule()}>
        调整计划日期
      </Button>
      <Small tone={result.startsWith('提交失败') ? 'danger' : 'muted'}>
        {result || `当前计划完成：${planned}`}
      </Small>
    </Flex>
  );
});
