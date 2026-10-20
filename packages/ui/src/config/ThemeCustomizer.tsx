/**
 * 主题编辑器：几个旋钮（品牌色、中性色、圆角、缩放、字体、动效）调出自己的主题，实时检查对比度，给出可以粘贴的代码。
 * 只管设置（ThemeSettings）；把设置套到主题上由使用方做（customizeTheme），这样设置可以记在本地、和主题偏好组合：
 *
 *   let settings = _state<ThemeSettings>({});
 *   app.use(createUi({ theme: () => customizeTheme(preference.theme, settings) }));
 *   <ThemeCustomizer settings={_bind(settings)} base={preference.theme} />
 *
 * 对比度按 CONTRAST_PAIRS 检查，读的是 contrastTarget（默认页面根元素）上实际生效的颜色，
 * 所以改了设置、换了明暗都会重新检查。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { nextTick, watch, type VNodeChild } from 'vue';
import { Button } from '../base/Button';
import { CodeBlock } from '../base/CodeBlock';
import { Text } from '../base/Text';
import { Alert } from '../feedback/Alert';
import { ToggleGroup, ToggleItem } from '../input/ToggleGroup';
import { Flex } from '../layout/Flex';
import { mergeAttrs, type PartProps } from '../utils/props';
import { useLang } from './context';
import { builtinThemes } from './theme/builtin';
import { checkContrast, type ContrastIssue } from './theme/contrast';
import {
  themeSettingsCode,
  type FontPresets,
  type MotionPresets,
  type RadiusPresets,
  type ThemeSettings,
} from './theme/customize';
import {
  ACCENT_SCALES,
  NEUTRAL_SCALES,
  scaleSwatch,
  type AccentScale,
  type NeutralScale,
} from './theme/palette';
import { readToken, type Theme } from './theme/theme';
import { colors } from './theme/tokens.stylex';

/** 未声明的属性落到外层 div 上 */
export interface ThemeCustomizerProps extends PartProps<'div'> {
  /** 设置：父级写 settings={_bind(x)} */
  settings?: ThemeSettings;
  /** 设置套在哪套主题上：决定色块取亮色还是暗色色阶、导出代码里的基础主题 */
  base: Theme;
  /** 从哪个元素上读实际生效的颜色做对比度检查，默认页面根元素 */
  contrastTarget?: HTMLElement | null;
}

/** ThemeCustomizer 的样式：root、section、swatches、swatch */
export const themeCustomizerStyles = stylex.create({
  root: { display: 'flex', flexDirection: 'column', gap: '_xl' },
  section: { display: 'flex', flexDirection: 'column', gap: '_sm' },
  swatches: { flexWrap: 'wrap' },
  swatch: {
    display: 'block',
    width: '1.25em',
    height: '1.25em',
    borderRadius: '_full',
    boxShadow: 'inset 0 0 0 1px rgb(0 0 0 / 0.12)',
  },
});

// 色块的颜色是色阶里的任意值，用动态样式；单独一个 create，见 COMPONENTS.md §4
/** ThemeCustomizer 的动态样式：色块的颜色 */
export const themeCustomizerDynamicStyles = stylex.create({
  fill: (color: string) => ({ backgroundColor: color }),
});

/** 内置主题名 → 导出代码里的变量名（high-contrast → highContrastTheme）；不是内置主题时没有 */
function baseVariable(name: string): string | undefined {
  if (!(name in builtinThemes)) return undefined;
  return `${name.replace(/-(\w)/g, (_, letter: string) => letter.toUpperCase())}Theme`;
}

const SCALINGS = ['0.9', '0.95', '1', '1.05', '1.1'];

/** 主题编辑器：旋钮、对比度检查与导出代码 */
export const ThemeCustomizer = _component(
  ({
    settings = _bindable<ThemeSettings>({}),
    base,
    contrastTarget,
    ...rest
  }: ThemeCustomizerProps) => {
    const lang = useLang();
    let issues = _state.raw<ContrastIssue[]>([]);

    /** 改一个旋钮：空值表示沿用主题本来的取值 */
    function set<Key extends keyof ThemeSettings>(key: Key, value: ThemeSettings[Key] | '') {
      settings = { ...settings, [key]: value === '' ? undefined : value };
    }

    // 设置或主题变了：等新主题写进页面，再读实际生效的颜色检查对比度
    watch(
      () => [settings, base],
      async () => {
        await nextTick();
        const target = contrastTarget ?? document.documentElement;
        try {
          issues = checkContrast((token) =>
            readToken(target, colors[token as keyof typeof colors] as never),
          );
        } catch {
          // 主题的颜色还没写进页面（服务端渲染、没有样式的测试环境）：读不到就不检查
          issues = [];
        }
      },
      { immediate: true, deep: true, flush: 'post' },
    );

    const appearance = () => base.colorScheme;
    const section = (label: string, control: VNodeChild) => (
      <div {...mergeAttrs<'div'>({ sx: themeCustomizerStyles.section })}>
        <Text size="sm" weight="semibold">
          {label}
        </Text>
        {control}
      </div>
    );
    const swatches = (
      label: string,
      scales: readonly (AccentScale | NeutralScale)[],
      value: string | undefined,
      onChange: (next: string) => void,
    ) => (
      <ToggleGroup
        value={value ?? ''}
        {...{ 'onUpdate:value': onChange }}
        required
        aria-label={label}
        sx={themeCustomizerStyles.swatches}
      >
        <ToggleItem value="">{lang.customizeDefault}</ToggleItem>
        {scales.map((scale) => (
          <ToggleItem key={scale} value={scale} aria-label={scale} title={scale}>
            <span
              {...mergeAttrs<'span'>({
                sx: [
                  themeCustomizerStyles.swatch,
                  themeCustomizerDynamicStyles.fill(scaleSwatch(scale, appearance())),
                ],
              })}
            />
          </ToggleItem>
        ))}
      </ToggleGroup>
    );
    const segments = <Key extends string>(
      label: string,
      options: readonly [Key, string][],
      value: Key,
      onChange: (next: Key) => void,
    ) => (
      <ToggleGroup
        value={value}
        {...{ 'onUpdate:value': onChange }}
        required
        aria-label={label}
        sx={themeCustomizerStyles.swatches}
      >
        {options.map(([option, text]) => (
          <ToggleItem key={option} value={option}>
            {text}
          </ToggleItem>
        ))}
      </ToggleGroup>
    );

    return () => {
      const radii: [keyof RadiusPresets, string][] = [
        ['none', lang.customizeRadiusNone],
        ['small', lang.customizeRadiusSmall],
        ['medium', lang.customizeRadiusMedium],
        ['large', lang.customizeRadiusLarge],
      ];
      const fonts: [keyof FontPresets, string][] = [
        ['sans', lang.customizeFontSans],
        ['serifHeadings', lang.customizeFontSerifHeadings],
      ];
      const motions: [keyof MotionPresets, string][] = [
        ['none', lang.customizeMotionNone],
        ['fast', lang.customizeMotionFast],
        ['normal', lang.customizeMotionNormal],
        ['slow', lang.customizeMotionSlow],
      ];
      const code = themeSettingsCode(
        baseVariable(base.name.replace(/-custom$/, '')) ??
          (appearance() === 'dark' ? 'darkTheme' : 'lightTheme'),
        settings,
        appearance(),
      );
      return (
        <div {...mergeAttrs<'div'>({ sx: themeCustomizerStyles.root }, rest)}>
          {section(
            lang.customizeAccent,
            swatches(lang.customizeAccent, ACCENT_SCALES, settings.accent, (next) =>
              set('accent', next as AccentScale | ''),
            ),
          )}
          {section(
            lang.customizeNeutral,
            swatches(lang.customizeNeutral, NEUTRAL_SCALES, settings.neutral, (next) =>
              set('neutral', next as NeutralScale | ''),
            ),
          )}
          {section(
            lang.customizeRadius,
            segments(lang.customizeRadius, radii, settings.radius ?? 'medium', (next) =>
              set('radius', next),
            ),
          )}
          {section(
            lang.customizeScaling,
            segments(
              lang.customizeScaling,
              SCALINGS.map((scaling) => [scaling, `${Math.round(Number(scaling) * 100)}%`]),
              String(settings.scaling ?? 1),
              (next) => set('scaling', Number(next)),
            ),
          )}
          {section(
            lang.customizeFont,
            segments(lang.customizeFont, fonts, settings.font ?? 'sans', (next) =>
              set('font', next),
            ),
          )}
          {section(
            lang.customizeMotion,
            segments(lang.customizeMotion, motions, settings.motion ?? 'normal', (next) =>
              set('motion', next),
            ),
          )}
          {section(
            lang.customizeContrast,
            issues.length === 0 ? (
              <Alert tone="success">{lang.customizeContrastOk}</Alert>
            ) : (
              <Alert tone="warning">
                <Flex direction="column" gap="xs">
                  {issues.map((issue) => (
                    <span key={`${issue.foreground}-${issue.background}`}>
                      {lang.customizeContrastIssue(
                        `${issue.foreground} / ${issue.background}`,
                        issue.ratio.toFixed(2),
                        issue.minimum,
                      )}
                    </span>
                  ))}
                </Flex>
              </Alert>
            ),
          )}
          {section(lang.customizeCode, <CodeBlock code={code} lang="ts" />)}
          <Flex>
            <Button variant="soft" tone="neutral" onClick={() => (settings = {})}>
              {lang.customizeReset}
            </Button>
          </Flex>
        </div>
      );
    };
  },
);
