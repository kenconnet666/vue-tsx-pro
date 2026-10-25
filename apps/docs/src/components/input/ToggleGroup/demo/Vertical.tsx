import { Monitor, Moon, Sun } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Field, Flex, Grid, ToggleGroup, ToggleItem } from '@vue-tsx-pro/ui';

export default _component(() => {
  let appearance = _state('system');
  let density = _state('comfortable');
  return () => (
    <Grid minItemWidth="12rem" gap="lg">
      <Field label="外观">
        <ToggleGroup _value={_bind(appearance)} orientation="vertical" required>
          <ToggleItem value="light" icon={Sun}>
            亮色
          </ToggleItem>
          <ToggleItem value="dark" icon={Moon}>
            暗色
          </ToggleItem>
          <ToggleItem value="system" icon={Monitor}>
            跟随系统
          </ToggleItem>
        </ToggleGroup>
      </Field>
      <Flex direction="column" gap="md">
        <Field label="整组不可用">
          <ToggleGroup _value={_bind(density)} required disabled>
            <ToggleItem value="compact">紧凑</ToggleItem>
            <ToggleItem value="comfortable">适中</ToggleItem>
          </ToggleGroup>
        </Field>
        <Field label="单项不可用">
          <ToggleGroup _value={_bind(density)} required size="lg">
            <ToggleItem value="compact">紧凑</ToggleItem>
            <ToggleItem value="comfortable">适中</ToggleItem>
            <ToggleItem value="spacious" disabled>
              宽松
            </ToggleItem>
          </ToggleGroup>
        </Field>
      </Flex>
    </Grid>
  );
});
