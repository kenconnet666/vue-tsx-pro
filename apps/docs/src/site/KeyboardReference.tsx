/**
 * 组件页的“键盘”小节：按键 → 作用（COMPONENTS.md §8 的键盘映射）。放在示例之后、API 之前。
 * 按键写成 'Shift+Tab'，几个键效果相同时用 ' / ' 隔开（'↑ / ↓'），每个键画成一个键帽。
 *
 *   <KeyboardReference
 *     keys={[
 *       ['Enter / Space', '打开菜单，高亮第一项'],
 *       ['↑ / ↓', '移动高亮'],
 *     ]}
 *   />
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { Descriptions, Flex, H2, Kbd, Paragraph } from '@zerodep-dev/vue-tsx-pro-ui';
import type { VNodeChild } from 'vue';

const styles = css.create({
  // 按键一栏定宽（各行的作用对齐），长的组合在栏里换行；作用一栏占满
  label: { width: '15em', maxWidth: '45%' },
  keys: { display: 'inline-flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.3em' },
  joiner: { color: '_textMuted', fontSize: '_xs' },
});

/** KeyboardReference 的属性 */
export interface KeyboardReferenceProps {
  /** 按键与作用 */
  keys: readonly (readonly [keys: string, action: VNodeChild])[];
  /** 表格前的说明（焦点从哪里进、哪些键在哪个部件上生效） */
  children?: VNodeChild;
}

/** 一组按键画成键帽：' / ' 隔开的几种按法，每种按法是 '+' 连起来的组合 */
function keycaps(keys: string) {
  return (
    <span {...css.attrs(styles.keys)}>
      {keys.split(' / ').map((combo, index) => [
        index > 0 && (
          <span key={`or-${index}`} {...css.attrs(styles.joiner)}>
            或
          </span>
        ),
        // 只有 '+' 一个字时它就是那个键
        ...(combo === '+' ? ['+'] : combo.split('+')).map((key, keyIndex) => [
          keyIndex > 0 && (
            <span
              key={`plus-${index}-${keyIndex}`}
              aria-hidden="true"
              {...css.attrs(styles.joiner)}
            >
              +
            </span>
          ),
          <Kbd key={`${index}-${keyIndex}`}>{key}</Kbd>,
        ]),
      ])}
    </span>
  );
}

/** 键盘小节：标题“键盘”（锚点 #keyboard）与按键表 */
export const KeyboardReference = _component(({ keys, children }: KeyboardReferenceProps) => () => (
  <Flex direction="column" gap="lg">
    <H2 id="keyboard" size="xl" anchor>
      键盘
    </H2>
    {children != null && <Paragraph tone="muted">{children}</Paragraph>}
    <Descriptions
      bordered
      items={keys.map(([combo, action]) => ({ key: combo, label: keycaps(combo), value: action }))}
      propsLabel={{ sx: styles.label }}
    />
  </Flex>
));
