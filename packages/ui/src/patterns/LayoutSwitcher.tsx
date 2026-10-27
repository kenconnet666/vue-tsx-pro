/**
 * 布局切换：图标按钮弹出菜单，两组单选——侧栏的形式（固定 / 抽屉）和抽屉从哪一边滑出（左 / 右 / 上 / 下），
 * 配合 createLayoutPreference 与 AppShell 的 layout 使用，和 ThemeSwitcher 并排放在顶栏里。
 *
 *   const layout = createLayoutPreference({ defaults: { mode: 'overlay' } });
 *   <AppShell layout={layout} header={<><LayoutSwitcher layout={layout} /><ThemeSwitcher preference={theme} /></>} …>
 *
 * 选了“固定”时抽屉位置不可选（固定侧栏总是在起始边）。触发按钮的图标表示当前的位置。
 */
import { Columns2, PanelBottom, PanelLeft, PanelRight, PanelTop } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { IconButton, type IconButtonProps } from '../base/IconButton';
import { useMessages } from '../config/lang/messages';
import { patternsMessages } from './messages';
import type { IconData } from '../base/Icon';
import { Menu, MenuGroup, MenuRadioGroup, MenuRadioItem, type MenuProps } from '../overlay/Menu';
import {
  LAYOUT_MODES,
  LAYOUT_SIDES,
  type LayoutMode,
  type LayoutPreference,
  type LayoutSide,
} from '../config/layout/preference';
import { mergePartProps } from '../utils/props';

/** 未声明的属性落到菜单（role="menu" 的 div）上 */
export interface LayoutSwitcherProps extends Omit<MenuProps, 'trigger' | 'children'> {
  /** createLayoutPreference 的结果 */
  layout: LayoutPreference;
  /** 触发按钮的部件属性 */
  propsTrigger?: Partial<IconButtonProps>;
}

const SIDE_ICONS: Record<LayoutSide, IconData> = {
  start: PanelLeft,
  end: PanelRight,
  top: PanelTop,
  bottom: PanelBottom,
};

/** 布局切换（图标按钮 + 两组单选菜单） */
export const LayoutSwitcher = _component(
  ({ layout, propsTrigger, ...rest }: LayoutSwitcherProps) => {
    const messages = useMessages('patterns', patternsMessages);
    const modeLabels: Record<LayoutMode, string> = {
      docked: messages.layoutModeDocked,
      overlay: messages.layoutModeOverlay,
    };
    const sideLabels: Record<LayoutSide, string> = {
      start: messages.layoutSideStart,
      end: messages.layoutSideEnd,
      top: messages.layoutSideTop,
      bottom: messages.layoutSideBottom,
    };
    // 触发按钮：抽屉时显示它的方向，固定时显示“两栏”
    const triggerIcon = () => (layout.mode === 'overlay' ? SIDE_ICONS[layout.side] : Columns2);

    return () => (
      <Menu
        {...rest}
        trigger={(props) => (
          <IconButton
            {...mergePartProps<IconButtonProps>(
              { icon: triggerIcon(), 'aria-label': messages.layoutLabel },
              propsTrigger,
              props,
            )}
          />
        )}
      >
        <MenuGroup label={messages.layoutMode}>
          <MenuRadioGroup
            _value={layout.mode}
            onUpdate:_value={(value: string) => (layout.mode = value as LayoutMode)}
            aria-label={messages.layoutMode}
          >
            {LAYOUT_MODES.map((mode) => (
              <MenuRadioItem
                key={mode}
                value={mode}
                icon={mode === 'overlay' ? PanelLeft : Columns2}
              >
                {modeLabels[mode]}
              </MenuRadioItem>
            ))}
          </MenuRadioGroup>
        </MenuGroup>
        <MenuGroup label={messages.layoutSide}>
          <MenuRadioGroup
            _value={layout.side}
            onUpdate:_value={(value: string) => (layout.side = value as LayoutSide)}
            aria-label={messages.layoutSide}
          >
            {LAYOUT_SIDES.map((side) => (
              <MenuRadioItem
                key={side}
                value={side}
                icon={SIDE_ICONS[side]}
                disabled={layout.mode !== 'overlay'}
              >
                {sideLabels[side]}
              </MenuRadioItem>
            ))}
          </MenuRadioGroup>
        </MenuGroup>
      </Menu>
    );
  },
);
