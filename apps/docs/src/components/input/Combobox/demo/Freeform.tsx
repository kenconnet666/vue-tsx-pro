// allowCustomValue：可以输入选项里没有的文字（职位名称常有新的）；前置图标、外观与状态同其他输入框
import { BriefcaseBusiness, Search } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Code, Combobox, Field, Grid } from '@vue-tsx-pro/ui';

const titles = ['产品经理', '交互设计师', '视觉设计师', '前端工程师', '后端工程师', '测试工程师'];

export default _component(() => {
  let title = _state<string | undefined>();
  let typed = _state('');
  return () => (
    <Grid minItemWidth="15rem" gap="lg">
      <Field
        label="职位"
        description={
          title ? (
            <>
              选中了 <Code>{title}</Code>
            </>
          ) : (
            <>
              自由输入：<Code>{typed || '（空）'}</Code>，value 为 undefined
            </>
          )
        }
      >
        <Combobox
          items={titles}
          value={_bind(title)}
          inputValue={_bind(typed)}
          allowCustomValue
          icon={BriefcaseBusiness}
          clearable
          placeholder="选择或输入"
        />
      </Field>
      <Field label='variant="soft" radius="full"'>
        <Combobox
          items={titles}
          icon={Search}
          variant="soft"
          radius="full"
          placeholder="搜索职位"
        />
      </Field>
      <Field label="只读" readonly>
        <Combobox items={titles} value="前端工程师" />
      </Field>
      <Field label="不可用" disabled>
        <Combobox items={titles} value="测试工程师" />
      </Field>
    </Grid>
  );
});
