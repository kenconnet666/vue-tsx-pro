/**
 * 详情行（台账展开的一行）里带标题的一段：标题一行（进度写在标题里，淡色；齐全时 success）加内容
 */
import { _component } from '@vue-tsx-pro/tsx';
import { createFlex, Small, type FlexProps } from '@vue-tsx-pro/ui';
import type { VNodeChild } from 'vue';

const Section = createFlex('section', 'DetailSectionRoot');

/** 带标题的一段 */
export const DetailSection = _component(
  ({
    title,
    tone,
    children,
    ...rest
  }: Omit<FlexProps<'section'>, 'title'> & {
    /** 标题 */
    title: VNodeChild;
    /** 标题的色调：齐全时用 success；默认淡色 */
    tone?: 'success';
    children?: VNodeChild;
  }) =>
    () => (
      <Section direction="column" gap="xs" {...rest}>
        <Small tone={tone ?? 'muted'}>{title}</Small>
        {children}
      </Section>
    ),
);
