/**
 * 标签页：一排标题切换下面的内容（全部、待付款、待收货）。选中的标题下面一条主色短线；可以左右滑内容切换，标题栏可以吸顶。
 *
 *   <Tabs _value={status} swipeable sticky>
 *     <Tab name="all" title="全部">…</Tab>
 *     <Tab name="unpaid" title="待付款" badge={2}>…</Tab>
 *   </Tabs>
 *
 * 内容在第一次切到时才渲染，之后切走只是藏起来（保留滚动、输入的状态）。标题多于 4 个时标题栏可以横向滚动。
 */
import { _component, createContext } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { onBeforeUnmount, shallowReactive, type VNodeChild } from 'vue';
import { Badge } from '../display/Badge';
import { dataAttrs, mergeAttrs, type PartProps } from '../utils/props';
import { Sticky } from './Sticky';

/** 一个标签登记给标签页的 */
interface TabEntry {
  readonly name: string;
  readonly title: VNodeChild;
  readonly disabled: boolean;
  readonly badge: number | string | boolean | undefined;
}

/** 标签页提供给各个标签的 */
interface TabsState {
  readonly value: string | undefined;
  register(entry: TabEntry): () => void;
}

const TabsContext = createContext<TabsState>('Tabs');

/** 未声明的属性落到根元素（div）上 */
export interface TabsProps extends Omit<PartProps<'div'>, 'onChange'> {
  /** 选中的标签；双向绑定写 `_value={x}`。不给时选第一个 */
  _value?: string;
  /** 左右滑内容切换标签 */
  swipeable?: boolean;
  /** 标题栏吸顶 */
  sticky?: boolean;
  /** 吸顶时离顶部多远（CSS 长度） */
  offsetTop?: string;
  /** 换了标签 */
  onChange?: (name: string) => void;
  /** 各个 Tab */
  children?: VNodeChild;
  /** 标题栏的部件属性 */
  propsNav?: PartProps<'div'>;
}

/** Tabs、Tab 的样式 */
export const tabsStyles = css.create({
  nav: {
    display: 'flex',
    overflowX: 'auto',
    backgroundColor: '_surface',
    borderBlockEndWidth: '_hairline',
    borderBlockEndStyle: 'solid',
    borderBlockEndColor: '_border',
    scrollbarWidth: 'none',
  },
  tab: {
    position: 'relative',
    flex: '1 0 auto',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '4.5em',
    height: '2.9em',
    margin: 0,
    paddingBlock: 0,
    paddingInline: '_md',
    borderWidth: 0,
    backgroundColor: 'transparent',
    color: {
      default: '_textMuted',
      '[aria-selected="true"]': '_text',
      '[disabled]': '_textDisabled',
    },
    fontFamily: 'inherit',
    fontSize: '_md',
    fontWeight: { default: '_normal', '[aria-selected="true"]': '_semibold' },
    whiteSpace: 'nowrap',
    cursor: { default: 'pointer', '[disabled]': 'not-allowed' },
  },
  // 少于 5 个时平分整行；多了按内容宽度排、可以横向滚动
  scrollable: { flex: 'none' },
  line: {
    position: 'absolute',
    insetBlockEnd: 0,
    insetInlineStart: '50%',
    width: '1.6em',
    height: '0.2em',
    borderRadius: '_full',
    backgroundColor: '_accent',
    transform: {
      default: 'translateX(-50%) scaleX(0)',
      '[data-selected]': 'translateX(-50%) scaleX(1)',
    },
    transitionProperty: 'transform',
    transitionDuration: '_md',
    transitionTimingFunction: '_standard',
  },
  panel: { display: { default: 'block', '[hidden]': 'none' } },
});

/** 两次触摸之间横向移动多少（px）算滑动 */
const SWIPE_DISTANCE = 50;

/** 标签页（div > 标题栏 + 内容） */
export const Tabs = _component(
  ({
    _value: value = _bindable<string | undefined>(undefined),
    swipeable = false,
    sticky = false,
    offsetTop,
    onChange,
    children,
    propsNav,
    ...rest
  }: TabsProps) => {
    const entries = shallowReactive<TabEntry[]>([]);
    const current = () => value ?? entries.find((entry) => !entry.disabled)?.name;
    const select = (name: string) => {
      if (name === current()) return;
      value = name;
      onChange?.(name);
    };
    TabsContext.provide({
      get value() {
        return current();
      },
      register(entry) {
        entries.push(entry);
        return () => entries.splice(entries.indexOf(entry), 1);
      },
    });

    // 左右滑内容：按下与松手的位置比较（滑动不需要 touchmove，页面照常竖着滚）
    let start: { x: number; y: number } | null = null;
    const onTouchstart = (event: TouchEvent) => {
      const touch = event.touches[0];
      start = touch ? { x: touch.clientX, y: touch.clientY } : null;
    };
    const onTouchend = (event: TouchEvent) => {
      const touch = event.changedTouches[0];
      if (!start || !touch) return;
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      start = null;
      if (Math.abs(dx) < SWIPE_DISTANCE || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      const enabled = entries.filter((entry) => !entry.disabled);
      const index = enabled.findIndex((entry) => entry.name === current());
      const next = enabled[index + (dx < 0 ? 1 : -1)];
      if (next) select(next.name);
    };

    return () => {
      const active = current();
      const scrollable = entries.length > 4;
      const nav = (
        <div {...mergeAttrs<'div'>({ sx: tabsStyles.nav }, propsNav, { role: 'tablist' })}>
          {entries.map((entry) => {
            const selected = entry.name === active;
            const title =
              entry.badge === undefined || entry.badge === false ? (
                entry.title
              ) : (
                <Badge
                  content={entry.badge === true ? undefined : entry.badge}
                  dot={entry.badge === true}
                >
                  {entry.title}
                </Badge>
              );
            return (
              <button
                {...mergeAttrs<'button'>(
                  { sx: [tabsStyles.tab, scrollable && tabsStyles.scrollable] },
                  {
                    type: 'button',
                    role: 'tab',
                    'aria-selected': selected ? 'true' : 'false',
                    disabled: entry.disabled,
                    onClick: () => select(entry.name),
                  },
                )}
              >
                {title}
                <span
                  {...mergeAttrs<'span'>(
                    { sx: tabsStyles.line },
                    dataAttrs({ 'data-selected': selected }),
                  )}
                />
              </button>
            );
          })}
        </div>
      );
      return (
        <div {...mergeAttrs<'div'>({}, rest, swipeable ? { onTouchstart, onTouchend } : {})}>
          {sticky ? <Sticky offsetTop={offsetTop}>{nav}</Sticky> : nav}
          {children}
        </div>
      );
    };
  },
);

/** 未声明的属性落到内容（div）上 */
export interface TabProps extends PartProps<'div', 'role' | 'title' | 'hidden'> {
  /** 名字：选中的状态按它记 */
  name: string;
  /** 标题 */
  title: VNodeChild;
  /** 不能选 */
  disabled?: boolean;
  /** 标题右上角的徽标：数字、文字，true 是小红点 */
  badge?: number | string | boolean;
  /** 内容 */
  children?: VNodeChild;
}

/** 标签（div[role=tabpanel]）：第一次选中时才渲染内容，切走后藏起来 */
export const Tab = _component(
  ({ name, title, disabled = false, badge, children, ...rest }: TabProps) => {
    const tabs = TabsContext.inject();
    const unregister = tabs.register({
      get name() {
        return name;
      },
      get title() {
        return title;
      },
      get disabled() {
        return disabled;
      },
      get badge() {
        return badge;
      },
    });
    onBeforeUnmount(unregister);
    let visited = false;
    return () => {
      const active = tabs.value === name;
      if (active) visited = true;
      if (!visited) return null;
      return (
        <div
          {...mergeAttrs<'div'>({ sx: tabsStyles.panel }, rest, {
            role: 'tabpanel',
            hidden: !active,
          })}
        >
          {children}
        </div>
      );
    };
  },
);
