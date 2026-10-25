import { _component } from '@vue-tsx-pro/tsx';
import {
  Button,
  Code,
  Field,
  Flex,
  Grid,
  NumberField,
  Select,
  Slider,
  Small,
  TagsInput,
} from '@vue-tsx-pro/ui';
import Decimal from 'decimal.js';

// 不用 useForm 也行：控件写了 name，就有隐藏的 input 随表单提交（FormValue），FormData 直接拿到
export default _component(() => {
  let city = _state('上海');
  let budget = _state(new Decimal('2999.90'));
  let rooms = _state(2);
  let tags = _state(['近地铁', '南向']);
  let data = _state('');
  const submit = (event: SubmitEvent) => {
    event.preventDefault();
    const form = new FormData(event.target as HTMLFormElement);
    data = [...form.entries()]
      .map(([key, value]) => `${key}=${typeof value === 'string' ? value : value.name}`)
      .join('&');
  };
  return () => (
    <form onSubmit={submit}>
      <Flex direction="column" gap="md">
        <Grid minItemWidth="12rem" gap="md">
          <Field label="城市">
            <Select items={['北京', '上海', '深圳', '杭州']} _value={_bind(city)} name="city" />
          </Field>
          <Field label="月租预算（元）">
            <NumberField _value={_bind(budget)} name="budget" step={100} />
          </Field>
        </Grid>
        <Field label={`卧室：${rooms} 间`}>
          <Slider _value={_bind(rooms)} min={1} max={5} name="rooms" />
        </Field>
        <Field label="偏好">
          <TagsInput _value={_bind(tags)} name="tags" />
        </Field>
        <Flex justify="end">
          <Button type="submit">搜索房源</Button>
        </Flex>
        {data && (
          <Small tone="muted">
            提交的查询串：<Code>{data}</Code>
          </Small>
        )}
      </Flex>
    </form>
  );
});
