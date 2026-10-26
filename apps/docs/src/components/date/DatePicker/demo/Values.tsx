// 值的类型：默认 ISO 字符串；valueType="dateValue" 写回 @internationalized/date 的对象，能直接做日期运算。
// name 让原生表单提交 ISO 字符串
import type { CalendarDate } from '@internationalized/date';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Button,
  Code,
  DatePicker,
  Field,
  Flex,
  Grid,
  useFormat,
} from '@zerodep-dev/vue-tsx-pro-ui';

export default _component(() => {
  const format = useFormat();
  let birthday = _state<CalendarDate | null>(null);
  let submitted = _state('');
  const onSubmit = (event: SubmitEvent) => {
    event.preventDefault();
    const data = new FormData(event.target as HTMLFormElement);
    submitted = JSON.stringify(Object.fromEntries(data));
  };
  return () => (
    <form onSubmit={onSubmit}>
      <Flex direction="column" gap="md">
        <Grid minItemWidth="15rem" gap="lg">
          <Field
            label="生日"
            description={
              birthday
                ? `${format.date(birthday, { dateStyle: 'full' })}；一百天是 ${format.date(birthday.add({ days: 100 }))}`
                : '值是 CalendarDate 对象，可以直接 add、compare'
            }
          >
            <DatePicker _value={birthday} valueType="dateValue" name="birthday" />
          </Field>
          <Field label="入职日期" description="name 随表单提交 ISO 字符串">
            <DatePicker _value="2021-03-15" name="joined" />
          </Field>
        </Grid>
        <Flex gap="sm" align="center" wrap>
          <Button type="submit" variant="outline" tone="neutral">
            提交表单
          </Button>
          {submitted && <Code>{submitted}</Code>}
        </Flex>
      </Flex>
    </form>
  );
});
