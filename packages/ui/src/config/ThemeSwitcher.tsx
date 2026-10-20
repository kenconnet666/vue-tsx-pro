/**
 * 主题切换：图标按钮弹出菜单，列出“跟随系统”与各套主题，配合 createThemePreference 使用。
 *
 *   const preference = createThemePreference({ themes: { light: lightTheme, dark: darkTheme, paper: paperTheme } });
 *   <ThemeSwitcher preference={preference} />
 *
 * 选中后新主题从按钮处圆形展开（revealTransition；不支持 View Transitions 或减少动态效果时直接切换）。
 * 按钮的图标表示当前的选择；内置的 light、dark、paper 与跟随系统有默认的文字和图标，其他主题用 labels、icons 补上。
 */
import { Monitor, Moon, Palette, ScrollText, Sun } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { IconButton, type IconButtonProps } from '../base/IconButton';
import type { IconData } from '../base/Icon';
import { Menu, MenuRadioGroup, MenuRadioItem, type MenuProps } from '../overlay/Menu';
import { toElement } from '../utils/dom/overlay';
import { mergePartProps } from '../utils/props';
import { useLang } from './context';
import { SYSTEM_THEME, type ThemePreference } from './theme/preference';

/** 未声明的属性落到菜单（role="menu" 的 div）上 */
export interface ThemeSwitcherProps<Name extends string> extends Omit<
  MenuProps,
  'trigger' | 'children'
> {
  /** createThemePreference 的结果 */
  preference: ThemePreference<Name>;
  /** 各选项的文字（键是主题名或 'system'）；内置主题与跟随系统默认取语言包，其他默认是主题名 */
  labels?: Partial<Record<Name | typeof SYSTEM_THEME, string>>;
  /** 各选项的图标；内置主题与跟随系统有默认图标，其他默认是调色板 */
  icons?: Partial<Record<Name | typeof SYSTEM_THEME, IconData>>;
  /** 列出“跟随系统”，默认 true */
  system?: boolean;
  /** 触发按钮的部件属性 */
  propsTrigger?: Partial<IconButtonProps>;
}

const DEFAULT_ICONS: Record<string, IconData> = {
  [SYSTEM_THEME]: Monitor,
  light: Sun,
  dark: Moon,
  paper: ScrollText,
};

/** 主题切换（图标按钮 + 单选菜单）：选中后从按钮处圆形展开新主题 */
export const ThemeSwitcher = _component(
  <Name extends string>({
    preference,
    labels,
    icons,
    system = true,
    propsTrigger,
    ...rest
  }: ThemeSwitcherProps<Name>) => {
    const lang = useLang();
    let button: HTMLElement | null = null;

    const labelOf = (name: string) =>
      (labels as Record<string, string | undefined> | undefined)?.[name] ??
      {
        [SYSTEM_THEME]: lang.themeSystem,
        light: lang.themeLight,
        dark: lang.themeDark,
        paper: lang.themePaper,
      }[name] ??
      name;
    const iconOf = (name: string) =>
      (icons as Record<string, IconData | undefined> | undefined)?.[name] ??
      DEFAULT_ICONS[name] ??
      Palette;

    function choose(next: string) {
      const rect = button?.getBoundingClientRect();
      const origin = rect && { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      void preference.set(next as Name, { origin });
    }

    return () => {
      const choices: string[] = system
        ? [SYSTEM_THEME, ...preference.names]
        : [...preference.names];
      return (
        <Menu
          {...rest}
          trigger={(props) => (
            <IconButton
              {...mergePartProps<IconButtonProps>(
                { icon: iconOf(preference.preference), 'aria-label': lang.themeLabel },
                propsTrigger,
                {
                  ...props,
                  ref: (value: unknown) => {
                    props.ref(value);
                    button = toElement(value);
                  },
                },
              )}
            />
          )}
        >
          <MenuRadioGroup
            value={preference.preference}
            {...{ 'onUpdate:value': choose }}
            aria-label={lang.themeLabel}
          >
            {choices.map((name) => (
              <MenuRadioItem key={name} value={name} icon={iconOf(name)}>
                {labelOf(name)}
              </MenuRadioItem>
            ))}
          </MenuRadioGroup>
        </Menu>
      );
    };
  },
);
