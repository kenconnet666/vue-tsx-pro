import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
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
} from '@zerodep-dev/vue-tsx-pro-ui';
import type { VNodeChild } from 'vue';

const styles = css.create({
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

// 高矮不一，才看得出 align 的差别；宽度差别小一点，两列排版时一行也放得下五个（不换行时不撑出卡片）
const boxes = css.create({
  size: (height: number) => ({ height: `${height}rem`, paddingInline: `${height / 4}rem` }),
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
          <ToggleGroup _value={direction} required size="sm" aria-label="direction">
            <ToggleItem value="row">row</ToggleItem>
            <ToggleItem value="column">column</ToggleItem>
          </ToggleGroup>,
        )}
        {control(
          'gap',
          <ToggleGroup _value={gap} required size="sm" aria-label="gap">
            {(['none', 'xs', 'sm', 'md', 'lg', 'xl'] as const).map((value) => (
              <ToggleItem key={value} value={value}>
                {value}
              </ToggleItem>
            ))}
          </ToggleGroup>,
        )}
        {control(
          'align',
          <ToggleGroup _value={align} required size="sm" aria-label="align">
            {(['start', 'center', 'end', 'stretch', 'baseline'] as const).map((value) => (
              <ToggleItem key={value} value={value}>
                {value}
              </ToggleItem>
            ))}
          </ToggleGroup>,
        )}
        {control(
          'justify',
          <ToggleGroup _value={justify} required size="sm" aria-label="justify">
            {(['start', 'center', 'end', 'between', 'evenly'] as const).map((value) => (
              <ToggleItem key={value} value={value}>
                {value}
              </ToggleItem>
            ))}
          </ToggleGroup>,
        )}
        {control('wrap', <Switch _checked={wrap} aria-label="wrap" />)}
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
          <div key={index} {...css.attrs(styles.box, boxes.size(height))}>
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
