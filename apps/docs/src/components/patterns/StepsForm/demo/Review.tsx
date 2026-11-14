// 标签布局、只读、不可用同 Form：labelPlacement="start" 把标签排在左边（labelWidth 定宽、labelAlign 对齐）；
// readonly 用来回看已经提交的单子——各步照常切换，控件都改不了，最后一步没有“提交”可点
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Card,
  DatePicker,
  Flex,
  NumberField,
  Select,
  Switch,
  Textarea,
  TextField,
  useForm,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { StepsForm } from '@zerodep-dev/vue-tsx-pro-ui/patterns';
import { z } from 'zod';

const reasons = ['设备更新', '产能扩充', '安全整改', '研发试制'];

const schema = z.object({
  title: z.string().min(2, '请填写申请名称'),
  reason: z.string('请选择事由').min(1, '请选择事由'),
  amount: z.number('请填写金额').min(1, '金额要大于 0'),
  needBy: z.string('请选择日期').min(1, '请选择日期'),
  note: z.string().max(200, '最多 200 字'),
});

export default _component(() => {
  let readonly = _state(true);
  const form = useForm({
    schema,
    initial: {
      title: '二号线冲压机更换',
      reason: '设备更新',
      amount: 386000,
      needBy: '2024-09-30',
      note: '旧设备已超期服役两年，故障停机每月超过 20 小时。',
    },
    onSubmit: async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      readonly = true;
    },
  });

  return () => (
    <Card>
      <Flex direction="column" gap="lg">
        <Switch _value={readonly} description="关掉后可以修改并重新提交">
          只读回看
        </Switch>
        <StepsForm
          form={form}
          labelPlacement="start"
          labelWidth="6em"
          labelAlign="end"
          readonly={readonly}
          submitText="重新提交"
          steps={[
            {
              title: '申请内容',
              fields: ['title', 'reason'],
              content: () => (
                <>
                  <form.Field name="title" label="申请名称">
                    <TextField />
                  </form.Field>
                  <form.Field name="reason" label="事由">
                    <Select items={reasons} />
                  </form.Field>
                </>
              ),
            },
            {
              title: '金额与时间',
              fields: ['amount', 'needBy', 'note'],
              content: () => (
                <>
                  <form.Field name="amount" label="金额（元）">
                    <NumberField />
                  </form.Field>
                  <form.Field name="needBy" label="最晚到位">
                    <DatePicker />
                  </form.Field>
                  <form.Field name="note" label="说明">
                    <Textarea rows={2} />
                  </form.Field>
                </>
              ),
            },
          ]}
        />
      </Flex>
    </Card>
  );
});
