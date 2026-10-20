import { Search } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Field, Flex, Grid, Small, TextField } from '@vue-tsx-pro/ui';

const sizes = ['sm', 'md', 'lg'] as const;

export default _component(() => () => (
  <Flex direction="column" gap="lg">
    <Grid columns={2} gap="md">
      {(['surface', 'soft'] as const).map((variant) => (
        <Flex key={variant} direction="column" gap="sm">
          <Small tone="muted">variant="{variant}"</Small>
          {sizes.map((size) => (
            <TextField
              key={size}
              variant={variant}
              size={size}
              icon={Search}
              placeholder={`size="${size}"`}
              aria-label={`${variant} ${size}`}
            />
          ))}
          <TextField
            variant={variant}
            radius="full"
            icon={Search}
            placeholder='radius="full"'
            aria-label={`${variant} 圆角`}
          />
        </Flex>
      ))}
    </Grid>
    <Grid minItemWidth="11rem" gap="md">
      <Field label="不可用" disabled>
        <TextField value="不能改" />
      </Field>
      <Field label="只读" readonly>
        <TextField value="可以选中复制" />
      </Field>
      <Field label="校验未通过" error="这个用户名已经被占用了">
        <TextField value="admin" />
      </Field>
    </Grid>
  </Flex>
));
