/**
 * 组件默认值：应用级 `createUi({ defaults })`、局部 `<Provider defaults>` 统一改组件的默认外观，
 * 不必每处都写（参考 Ant Design 的 ConfigProvider、MUI 主题的 defaultProps）。
 * 优先级：组件上显式写的 prop > 最近一层 Provider > createUi > 组件自己的默认值。
 *
 *   createUi({ defaults: { Button: { variant: 'outline', size: 'sm' } } })
 *
 * 只收外观类的选项（样式、尺寸、色调）；行为类的（disabled、loading）每处单独决定。
 */
import { useConfig } from './context';
import type { BadgeOptions } from '../base/badge-styles';
import type { AlertOptions } from '../feedback/Alert';
import type { DialogOptions } from '../feedback/Dialog';
import type { DrawerOptions } from '../feedback/Drawer';
import type { AvatarOptions } from '../display/Avatar';
import type { CardOptions } from '../display/Card';
import type { ChoiceOptions } from '../input/choice-styles';
import type { ControlOptions } from '../input/control';
import type { TabsOptions } from '../navigation/Tabs';
import type { TableOptions } from '../table/TableView';
import type { ButtonOptions } from '../base/button-core';

/** 可以配置默认值的组件与选项；新组件有外观档位时在这里登记 */
export interface ComponentDefaults {
  /** Button、LinkButton、IconButton 共用 */
  Button?: Partial<Pick<ButtonOptions, 'variant' | 'tone' | 'size' | 'radius'>>;
  /** Badge、Tag 共用 */
  Badge?: BadgeOptions;
  /** Alert */
  Alert?: AlertOptions;
  /** Card */
  Card?: CardOptions;
  /** Dialog、AlertDialog 共用 */
  Dialog?: DialogOptions;
  /** Drawer */
  Drawer?: DrawerOptions;
  /** Avatar */
  Avatar?: AvatarOptions;
  /** Tabs */
  Tabs?: TabsOptions;
  /** 输入框：TextField、Textarea、NumberField、Select、Combobox 共用 */
  Input?: ControlOptions;
  /** 勾选类控件：Checkbox、RadioGroup、Switch 共用 */
  Choice?: ChoiceOptions;
  /** 表格：Table、TreeTable 共用 */
  Table?: TableOptions;
}

/** 合并两层默认值：按组件逐个合并，内层写了的选项覆盖外层 */
export function mergeDefaults(
  outer: ComponentDefaults,
  inner: ComponentDefaults | undefined,
): ComponentDefaults {
  if (!inner) return outer;
  const merged: Record<string, object | undefined> = { ...outer };
  for (const [name, options] of Object.entries(inner)) {
    merged[name] = { ...(outer as Record<string, object | undefined>)[name], ...options };
  }
  return merged as ComponentDefaults;
}

/**
 * 某个组件当前的默认值：`const defaults = useDefaults('Button')`，渲染时 `variant ?? defaults.variant ?? 'solid'`。
 * 返回的对象总是读最新配置，Provider 切换后跟着变。
 */
export function useDefaults<Name extends keyof ComponentDefaults>(
  name: Name,
): NonNullable<ComponentDefaults[Name]> {
  const config = useConfig();
  return new Proxy({} as NonNullable<ComponentDefaults[Name]>, {
    get: (_, key) => (config.defaults[name] as Record<PropertyKey, unknown> | undefined)?.[key],
  });
}
