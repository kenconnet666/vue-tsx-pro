/**
 * 常用的图标按钮预设：CloseButton（关闭弹层、标签、提示条）与 ClearButton（清空输入）。
 * 图标来自 Lucide，无障碍名称取语言包（lang.close / lang.clear），也可以用 aria-label 改。
 * 同一个工厂生成，各是一个组件（COMPONENTS.md §1）。
 *
 *   <CloseButton onClick={close} />
 *   <ClearButton size="sm" onClick={() => (value = '')} />
 */
import { CircleX, X } from '@lucide/icons';
import { _component, type TsxComponent } from '@zerodep-dev/vue-tsx-pro-tsx';
import { useLang } from '../config/context';
import type { Lang } from '../config/lang/lang';
import { IconButton, type IconButtonProps } from './IconButton';
import type { IconData } from './Icon';

/** 未声明的属性落到 IconButton 上；图标固定，名称默认取语言包 */
export type PresetIconButtonProps = Omit<IconButtonProps, 'icon' | 'aria-label'> & {
  /** 无障碍名称，默认取语言包（关闭 / 清空） */
  'aria-label'?: string;
};

/** 预设图标与名称的图标按钮（CloseButton、ClearButton 由它生成）：名称默认取语言包，可以用 aria-label 覆盖 */
export function createPresetIconButton(
  name: string,
  icon: IconData,
  label: (lang: Lang) => string,
): TsxComponent<PresetIconButtonProps> {
  return _component(
    ({ 'aria-label': ariaLabel, ...rest }: PresetIconButtonProps) => {
      const lang = useLang();
      return () => <IconButton {...rest} icon={icon} aria-label={ariaLabel ?? label(lang)} />;
    },
    { name },
  );
}

/** 关闭按钮：X 图标，名称“关闭” */
export const CloseButton = createPresetIconButton('CloseButton', X, (lang) => lang.close);
/** 清空按钮：圆圈 X 图标，名称“清空”；输入框里清空内容用 */
export const ClearButton = createPresetIconButton('ClearButton', CircleX, (lang) => lang.clear);
