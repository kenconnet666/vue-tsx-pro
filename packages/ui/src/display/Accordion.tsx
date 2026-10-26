/**
 * 手风琴，复合组件：Accordion（div）> AccordionItem（标题按钮 + 展开收起的内容）。WAI-ARIA 的 Accordion 模式：
 * 每个标题是 heading 里的 button（aria-expanded、aria-controls），内容是 role="region"、以标题为名称；
 * 标题都在 Tab 顺序里，另外 ↑ / ↓ 在标题之间移动（到头后循环），Home / End 到第一个、最后一个。参考 Radix Accordion。
 *
 *   <Accordion _value={open} aria-label="常见问题">
 *     <AccordionItem value="ship" title="多久发货？">付款后 48 小时内。</AccordionItem>
 *     <AccordionItem value="refund" title="怎么退款？">…</AccordionItem>
 *   </Accordion>
 *   <Accordion selectionMode="multiple" _value={openList}>…</Accordion>
 *
 * 展开收起的动画同 Collapsible（Collapse 的 CSS 过渡）。部件见 AccordionItemProps。
 */
import { ChevronDown } from '@lucide/icons';
import { createContext, _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { h, useId, type VNodeChild } from 'vue';
import { ButtonBase, type ButtonBaseProps } from '../base/ButtonBase';
import { Icon, type IconProps } from '../base/Icon';
import { selectedValues, toggleSelection, type SelectionProps } from '../utils/data/selection';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { disclosureStyles } from '../utils/style/transitions';
import { fontSizeStyles, type TextSize } from '../utils/style/typography';
import { Collapse, type CollapseProps } from './Collapse';

/** Accordion 交给 AccordionItem 的状态 */
export interface AccordionState {
  /** 展开着的项 */
  readonly expanded: readonly string[];
  /** 标题的层级（h2–h6） */
  readonly headingLevel: 2 | 3 | 4 | 5 | 6;
  /** 整组不可用 */
  readonly disabled: boolean;
  /** 展开或收起一项（单开 / 多开的规则由组决定） */
  toggle(value: string): void;
}

/** Accordion 的上下文：自定义的项可以 inject 它接入组 */
export const AccordionContext = createContext<AccordionState>('Accordion');

/** 两种方式共有的属性；未声明的属性落到外层 div 上 */
interface AccordionBaseProps extends PartProps<'div'> {
  /** 单开时允许把唯一展开的那项也收起，默认 true */
  collapsible?: boolean;
  /** 标题的层级，按所在页面的大纲选，默认 3 */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** 整组不可用 */
  disabled?: boolean;
  /** 字号档位；不写时继承 */
  size?: TextSize;
  /** AccordionItem */
  children?: VNodeChild;
}

/** 单开（selectionMode="single"，value 是展开项的值）或多开（value 是数组） */
export type AccordionProps = AccordionBaseProps & SelectionProps;

/** Accordion 的样式：root、item、heading、trigger、chevron、chevronOpen、content */
export const accordionStyles = css.create({
  root: { display: 'flex', flexDirection: 'column' },
  item: {
    borderBottomWidth: '_xs',
    borderBottomStyle: 'solid',
    borderBottomColor: '_borderMuted',
  },
  heading: { margin: 0, fontSize: 'inherit', fontWeight: 'inherit' },
  // 去掉按钮默认外观、焦点环、波纹、颜色过渡由 ButtonBase 给出
  trigger: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '_md',
    width: '_full',
    minHeight: '_minTarget',
    paddingBlock: '_md',
    paddingInline: '_sm',
    borderRadius: '_sm',
    backgroundColor: { default: 'transparent', ':hover': '_fill' },
    color: '_text',
    fontWeight: '_semibold',
    textAlign: 'start',
  },
  triggerDisabled: { opacity: '_disabled' },
  chevron: { flexShrink: 0, color: '_textMuted' },
  chevronOpen: { rotate: '180deg' },
  content: { paddingInline: '_sm', paddingBlockEnd: '_md', color: '_text' },
});

/** 手风琴：一组可展开收起的项，单开或多开 */
export const Accordion = _component(
  ({
    selectionMode = 'single',
    _value: value = _bindable<string | string[] | null>(null),
    collapsible = true,
    headingLevel = 3,
    disabled = false,
    size,
    children,
    ...rest
  }: AccordionProps) => {
    let root = _state.raw<HTMLElement | null>(null);
    const expanded = _derived(selectedValues(value));

    AccordionContext.provide({
      get expanded() {
        return expanded;
      },
      get headingLevel() {
        return headingLevel;
      },
      get disabled() {
        return disabled;
      },
      toggle(item) {
        const next = toggleSelection(expanded, item, {
          mode: selectionMode,
          required: !collapsible,
        });
        if (next === expanded) return;
        value = selectionMode === 'multiple' ? [...next] : (next[0] ?? null);
      },
    });

    // ↑ / ↓ 在标题之间移动（循环），Home / End 到两端；只在焦点在标题按钮上时处理
    function onKeydown(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (!root || !target.matches('[data-accordion-trigger]')) return;
      const triggers = [
        ...root.querySelectorAll<HTMLButtonElement>('[data-accordion-trigger]:not(:disabled)'),
      ].filter((trigger) => trigger.closest('[data-accordion]') === root);
      const index = triggers.indexOf(target as HTMLButtonElement);
      const next = {
        ArrowDown: triggers[(index + 1) % triggers.length],
        ArrowUp: triggers[(index - 1 + triggers.length) % triggers.length],
        Home: triggers[0],
        End: triggers.at(-1),
      }[event.key];
      if (!next) return;
      event.preventDefault();
      next.focus();
    }

    return () => (
      <div
        {...mergeAttrs<'div'>({ sx: [accordionStyles.root, size && fontSizeStyles[size]] }, rest, {
          ref: _toRef(root),
          onKeydown,
        })}
        data-accordion=""
        data-disabled={disabled || undefined}
      >
        {children}
      </div>
    );
  },
);

/** 未声明的属性落到每一项的外层 div 上 */
export interface AccordionItemProps extends PartProps<'div', 'title'> {
  /** 这一项的值 */
  value: string;
  /** 标题 */
  title: VNodeChild;
  /** 不可用：标题按钮 disabled，不能展开收起 */
  disabled?: boolean;
  /** 标题（h2–h6）的部件属性 */
  propsHeading?: PartProps<'h3'>;
  /** 标题按钮的部件属性 */
  propsTrigger?: Omit<Partial<ButtonBaseProps>, 'aria-expanded' | 'aria-controls'>;
  /** 展开箭头的部件属性 */
  propsChevron?: Partial<IconProps>;
  /** 内容区（Collapse，role="region"）的部件属性 */
  propsContent?: Partial<CollapseProps>;
  /** 内容 */
  children?: VNodeChild;
}

/** 手风琴里的一项：标题按钮 + 展开收起的内容 */
export const AccordionItem = _component(
  ({
    value,
    title,
    disabled = false,
    propsHeading,
    propsTrigger,
    propsChevron,
    propsContent,
    children,
    ...rest
  }: AccordionItemProps) => {
    const accordion = AccordionContext.inject();
    const id = useId();
    const triggerId = `${id}-trigger`;
    const contentId = `${id}-content`;
    // Collapse 在页内搜索命中（beforematch）时会写回 open：经这个对象交给组切换
    const model = {
      get open() {
        return accordion.expanded.includes(value);
      },
      set open(next: boolean) {
        if (next !== model.open) accordion.toggle(value);
      },
    };

    return () => {
      const open = model.open;
      const off = disabled || accordion.disabled;
      const state = open ? 'open' : 'closed';
      const trigger = (
        <ButtonBase
          {...mergePartProps<ButtonBaseProps>(
            { sx: [accordionStyles.trigger, off && accordionStyles.triggerDisabled] },
            propsTrigger,
            {
              id: triggerId,
              disabled: off,
              'aria-expanded': open,
              'aria-controls': contentId,
              onClick: () => accordion.toggle(value),
            },
          )}
          data-accordion-trigger=""
          data-state={state}
        >
          <span>{title}</span>
          <Icon
            {...mergePartProps<IconProps>(
              {
                icon: ChevronDown,
                sx: [
                  accordionStyles.chevron,
                  disclosureStyles.icon,
                  open && accordionStyles.chevronOpen,
                ],
              },
              propsChevron,
            )}
          />
        </ButtonBase>
      );
      return (
        <div
          {...mergeAttrs<'div'>({ sx: accordionStyles.item }, rest)}
          data-state={state}
          data-disabled={off || undefined}
        >
          {/* 标签名随 headingLevel，用 h() 渲染 */}
          {h(
            `h${accordion.headingLevel}`,
            mergeAttrs<'h3'>({ sx: accordionStyles.heading }, propsHeading),
            [trigger],
          )}
          <Collapse
            {...mergePartProps<CollapseProps>(
              { propsContent: { sx: accordionStyles.content } },
              propsContent,
              { id: contentId, role: 'region', 'aria-labelledby': triggerId },
            )}
            _open={model.open}
          >
            {children}
          </Collapse>
        </div>
      );
    };
  },
);
