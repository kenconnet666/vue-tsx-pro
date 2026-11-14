/**
 * 缩写（abbr）：点状下划线，悬停、键盘聚焦、触屏点按时显示全称。
 *
 *   <Abbr title="服务等级协议">SLA</Abbr> 承诺 99.9% 可用
 *
 * 原生的 title 只有鼠标悬停才看得到（键盘、触屏、不少读屏都拿不到），所以全称放在 Tooltip 里：
 * 元素可以聚焦（Tab 能到）、触屏点一下就显示，读屏把全称作为描述念出来。第一次出现时最好仍把全称写在正文里。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { Tooltip, type TooltipProps } from '../overlay/Tooltip';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { focusRingStyles } from '../utils/style/styles';

/** 未声明的属性落到 abbr 上 */
export interface AbbrProps extends PartProps<'abbr', 'title' | 'tabindex' | 'aria-describedby'> {
  /** 全称：显示在提示里 */
  title: string;
  /** 提示（Tooltip）的部件属性 */
  propsTooltip?: Partial<TooltipProps>;
  /** 缩写 */
  children?: VNodeChild;
}

/** Abbr 的样式 */
const abbrStyles = css.create({
  root: {
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
    textDecorationThickness: 'from-font',
    textUnderlineOffset: '0.2em',
    cursor: 'help',
    borderRadius: '_xs',
  },
});

/** 缩写：悬停、聚焦、点按时显示全称 */
export const Abbr = _component(({ title, propsTooltip, children, ...rest }: AbbrProps) => {
  // 触屏没有悬停，点按得到的焦点也不算键盘聚焦：点一下由这里打开（再点别处失焦时提示自己关）
  let open = _state(false);
  return () => (
    <Tooltip
      {...mergePartProps<TooltipProps>({ delay: 200, trigger: () => null }, propsTooltip)}
      _open={open}
      trigger={(props) => (
        <abbr
          {...mergeAttrs<'abbr'>({ sx: [abbrStyles.root, focusRingStyles.visible] }, rest, {
            ...props,
            tabindex: 0,
            onClick: () => (open = true),
          })}
        >
          {children}
        </abbr>
      )}
    >
      {title}
    </Tooltip>
  );
});
