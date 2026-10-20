import { ChevronDown, SlidersHorizontal } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  Button,
  Card,
  Collapsible,
  Field,
  Flex,
  Grid,
  NumberField,
  Select,
  TextField,
} from '@vue-tsx-pro/ui';

const styles = stylex.create({
  // Collapsible 不包外层元素：在纵向的 Flex 里触发按钮会被拉满整行，靠左放
  trigger: { alignSelf: 'flex-start' },
  chevron: { transitionProperty: 'rotate', transitionDuration: '_durations.md' },
  chevronOpen: { rotate: '180deg' },
});

export default _component(() => {
  let keyword = _state('机械键盘');
  let min = _state<number | null>(200);
  let max = _state<number | null>(800);
  let sort = _state('relevance');
  return () => (
    <Card>
      <Flex direction="column" gap="md">
        <Field label="搜索商品">
          <TextField value={_bind(keyword)} />
        </Field>
        <Collapsible
          trigger={(props) => (
            <Button
              {...props}
              variant="ghost"
              tone="neutral"
              icon={SlidersHorizontal}
              sx={styles.trigger}
              iconEnd={ChevronDown}
              propsIconEnd={{
                sx: [styles.chevron, props['aria-expanded'] && styles.chevronOpen],
              }}
            >
              高级筛选
            </Button>
          )}
        >
          <Grid minItemWidth="9em" gap="md">
            <Field label="最低价">
              <NumberField value={_bind(min)} min={0} />
            </Field>
            <Field label="最高价">
              <NumberField value={_bind(max)} min={0} />
            </Field>
            <Field label="排序">
              <Select
                value={_bind(sort)}
                items={[
                  { value: 'relevance', label: '综合' },
                  { value: 'sales', label: '销量' },
                  { value: 'price', label: '价格' },
                ]}
              />
            </Field>
          </Grid>
        </Collapsible>
      </Flex>
    </Card>
  );
});
