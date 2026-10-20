import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  Code,
  Flex,
  Switch,
  Text,
  ToggleGroup,
  ToggleItem,
  type FlexAligns,
  type FlexJustifies,
  type Space,
} from '@vue-tsx-pro/ui';
import type { VNodeChild } from 'vue';

const styles = stylex.create({
  label: { minWidth: '3.5em', color: '_textMuted' },
  stage: {
    minHeight: '11rem',
    padding: '_md',
    borderWidth: '_xs',
    borderStyle: 'dashed',
    borderColor: '_border',
    borderRadius: '_md',
  },
  box: {
    display: 'grid',
    placeItems: 'center',
    minWidth: '3rem',
    borderRadius: '_sm',
    backgroundColor: '_accentSoft',
    color: '_accentText',
    fontWeight: '_semibold',
  },
});

// 高矮不一，才看得出 align 的差别
const boxes = stylex.create({
  size: (height: number) => ({ height: `${height}rem`, paddingInline: `${height / 2}rem` }),
});
const heights = [2, 3.5, 2.5, 4, 3];

export default _component(() => {
  let direction = _state<'row' | 'column'>('row');
  let align = _state<keyof FlexAligns>('center');
  let justify = _state<keyof FlexJustifies>('start');
  let gap = _state<Space>('sm');
  let wrap = _state(false);

  const control = (label: string, group: VNodeChild) => (
    <Flex align="center" gap="sm">
      <Text size="sm" sx={styles.label}>
        {label}
      </Text>
      {group}
    </Flex>
  );

  return () => (
    <Flex direction="column" gap="md">
      <Flex direction="column" gap="sm">
        {control(
          'direction',
          <ToggleGroup value={_bind(direction)} required size="sm" aria-label="direction">
            <ToggleItem value="row">row</ToggleItem>
            <ToggleItem value="column">column</ToggleItem>
          </ToggleGroup>,
        )}
        {control(
          'gap',
          <ToggleGroup value={_bind(gap)} required size="sm" aria-label="gap">
            {(['none', 'xs', 'sm', 'md', 'lg', 'xl'] as const).map((value) => (
              <ToggleItem key={value} value={value}>
                {value}
              </ToggleItem>
            ))}
          </ToggleGroup>,
        )}
        {control(
          'align',
          <ToggleGroup value={_bind(align)} required size="sm" aria-label="align">
            {(['start', 'center', 'end', 'stretch', 'baseline'] as const).map((value) => (
              <ToggleItem key={value} value={value}>
                {value}
              </ToggleItem>
            ))}
          </ToggleGroup>,
        )}
        {control(
          'justify',
          <ToggleGroup value={_bind(justify)} required size="sm" aria-label="justify">
            {(['start', 'center', 'end', 'between', 'evenly'] as const).map((value) => (
              <ToggleItem key={value} value={value}>
                {value}
              </ToggleItem>
            ))}
          </ToggleGroup>,
        )}
        {control('wrap', <Switch checked={_bind(wrap)} aria-label="wrap" />)}
      </Flex>
      <Flex
        direction={direction}
        align={align}
        justify={justify}
        gap={gap}
        wrap={wrap}
        sx={styles.stage}
      >
        {heights.map((height, index) => (
          <div key={index} {...stylex.attrs(styles.box, boxes.size(height))}>
            {index + 1}
          </div>
        ))}
      </Flex>
      <Code>
        {`<Flex direction="${direction}" align="${align}" justify="${justify}" gap="${gap}"${wrap ? ' wrap' : ''}>`}
      </Code>
    </Flex>
  );
});
