/**
 * 可展开收起的区域：触发器 + Collapse（WAI-ARIA 的 Disclosure 模式）。以后的 Accordion 建在它上面。
 *
 *   <Collapsible trigger={(props) => <Button {...props}>高级选项</Button>}>…</Collapsible>
 *
 * 触发器用渲染函数而不是原生 <summary>：<summary> 必须是 <details> 的第一个子元素，触发器不能放在别处。
 * 键盘操作由触发器元素自己提供（按钮的 Enter、空格）。
 */
import { _component } from '@vue-tsx-pro/tsx';
import { useId, type VNodeChild } from 'vue';
import type { TriggerProps } from '../utils/props';
import { Collapse, type CollapseProps } from './Collapse';

/** 未声明的属性落到 Collapse 上 */
export interface CollapsibleProps extends CollapseProps {
  /** 触发器：`(props) => <Button {...props}>更多</Button>`，props 带 aria-expanded 与 aria-controls */
  trigger: (props: TriggerProps) => VNodeChild;
}

export const Collapsible = _component(
  ({ open = _bindable(false), trigger, id, ...rest }: CollapsibleProps) => {
    const generatedId = useId();
    const contentId = _derived(id ?? generatedId);

    return () => (
      <>
        {trigger({
          onClick: () => (open = !open),
          'aria-expanded': open,
          'aria-controls': contentId,
        })}
        <Collapse {...rest} id={contentId} open={_bind(open)} />
      </>
    );
  },
);
