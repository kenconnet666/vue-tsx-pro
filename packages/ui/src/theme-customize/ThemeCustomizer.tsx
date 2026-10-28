/**
 * 主题编辑器：几个旋钮（品牌色、中性色、圆角、缩放、字体、动效）调出自己的主题，实时检查对比度，给出可以粘贴的代码。
 * 只管设置（ThemeSettings）；把设置套到主题上由使用方做（customizeTheme），这样设置可以记在本地、和主题偏好组合：
 *
 *   let settings = _state<ThemeSettings>({});
 *   app.use(createUi({ theme: () => customizeTheme(preference.theme, settings) }));
 *   <ThemeCustomizer _settings={settings} base={preference.theme} />
 *
 * 旋钮分成颜色、形状与尺寸、字体与动效、检查与导出四组；每个选项带示意（色块与名字、圆角的角、字号、字体），
 * 当前取值写在旋钮名称旁边。对比度按 CONTRAST_PAIRS 检查，读的是 contrastTarget（默认页面根元素）上实际生效的颜色，
 * 所以改了设置、换了主题都会重新检查。
 */
import { Download, FileBraces, RotateCcw } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { nextTick, watch, type VNodeChild } from 'vue';
import { Button, type ButtonProps } from '../base/Button';
import { CodeBlock, type CodeBlockProps } from '../base/CodeBlock';
import { Text } from '../base/Text';
import { Alert, type AlertProps } from '../feedback/Alert';
import { ToggleGroup, ToggleItem } from '../input/ToggleGroup';
import { Flex } from '../layout/Flex';
import { downloadFile } from '../utils/dom/download';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { VisuallyHidden } from '../base/VisuallyHidden';
import { swatchStyles } from '../utils/style/swatch-styles';
import { useFormat } from '../config/lang/format';
import { useMessages } from '../config/lang/messages';
import { themeCustomizerMessages } from './messages';
import { builtinThemes } from '../config/theme/builtin';
import { CONTRAST_PAIRS, checkContrast, type ContrastIssue } from './contrast';
import {
  themeSettingsCode,
  type FontPresets,
  type MotionPresets,
  type RadiusPresets,
  type ThemeSettings,
} from './customize';
import { elementDesignTokens } from './design-tokens';
import {
  ACCENT_SCALES,
  NEUTRAL_SCALES,
  scaleSwatch,
  type AccentScale,
  type NeutralScale,
} from './palette';
import { readToken, type Theme } from '../config/theme/theme';
import { colors } from '../config/theme/tokens';

/** 未声明的属性落到外层 div 上 */
export interface ThemeCustomizerProps extends PartProps<'div'> {
  /** 设置：父级写 _settings={x} */
  _settings?: ThemeSettings;
  /** 设置套在哪套主题上：决定色块取亮色还是暗色色阶、导出代码里的基础主题 */
  base: Theme;
  /** 从哪个元素上读实际生效的颜色做对比度检查，默认页面根元素 */
  contrastTarget?: HTMLElement | null;
  /** 每个分组（section）的部件属性 */
  propsGroup?: PartProps<'section'>;
  /** 对比度检查结果（Alert）的部件属性；色调由检查结果决定 */
  propsContrast?: Omit<Partial<AlertProps>, 'tone'>;
  /** 导出代码（CodeBlock）的部件属性；代码与语言由组件管理 */
  propsCode?: Omit<Partial<CodeBlockProps>, 'code' | 'lang'>;
  /** 下载代码按钮的部件属性 */
  propsDownload?: Omit<Partial<ButtonProps>, 'onClick'>;
  /** 下载设计令牌（Figma 变量能导入的 JSON）按钮的部件属性 */
  propsDownloadTokens?: Omit<Partial<ButtonProps>, 'onClick'>;
  /** 恢复默认按钮的部件属性 */
  propsReset?: Omit<Partial<ButtonProps>, 'onClick'>;
}

/** ThemeCustomizer 的样式：root、group、groupHeader、field、fieldHeader、options、option、optionContent 等 */
export const themeCustomizerStyles = css.create({
  root: { display: 'flex', flexDirection: 'column', gap: '_xl' },
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: '_lg',
    // 组与组之间一条分隔线；第一组上面不画
    paddingBlockStart: { default: '_lg', ':first-child': 0 },
    borderBlockStartWidth: { default: '_xs', ':first-child': 0 },
    borderBlockStartStyle: 'solid',
    borderBlockStartColor: '_borderMuted',
  },
  groupHeader: { display: 'flex', flexDirection: 'column', gap: '_xs' },
  field: { display: 'flex', flexDirection: 'column', gap: '_sm' },
  fieldHeader: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: '_sm',
  },
  // 选项排成网格，窄栏里自动换行；每项左对齐，示意在前、名字在后
  options: {
    display: 'grid',
    // ToggleGroup 默认按内容宽：这里占满整栏，auto-fill 才按栏宽排出几列
    width: 'auto',
    gridTemplateColumns: 'repeat(auto-fill, minmax(6.5em, 1fr))',
  },
  option: { justifyContent: 'flex-start', minWidth: 0 },
  // 色板：只放色块，排成紧凑的网格；名字在悬停提示与读屏文字里，选中的名字与色值写在旋钮标题旁
  swatches: { gridTemplateColumns: 'repeat(auto-fill, minmax(2em, 1fr))' },
  swatchOption: { justifyContent: 'center', paddingInline: 0 },
  swatchLarge: { width: '1.25em', height: '1.25em' },
  optionContent: { display: 'flex', alignItems: 'center', gap: '_sm', minWidth: 0 },
  optionLabel: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  swatch: { flexShrink: 0, width: '1em', height: '1em', borderRadius: '_full' },
  // 主题默认：虚线圈，表示“不覆盖，沿用主题自己的颜色”
  swatchDefault: {
    boxSizing: 'border-box',
    borderWidth: '_xs',
    borderStyle: 'dashed',
    borderColor: '_borderStrong',
  },
  // 圆角示意：一个只有上边与左边的角
  corner: {
    flexShrink: 0,
    boxSizing: 'border-box',
    width: '1em',
    height: '1em',
    borderBlockStartWidth: '_sm',
    borderInlineStartWidth: '_sm',
    borderBlockStartStyle: 'solid',
    borderInlineStartStyle: 'solid',
    borderColor: 'currentColor',
  },
  sample: { flexShrink: 0, lineHeight: 1, fontWeight: '_semibold' },
  sans: { fontFamily: '_sans' },
  serif: { fontFamily: '_serif' },
});

/** ThemeCustomizer 的样式：圆角示意的四档（none、small、medium、large） */
export const themeCustomizerCornerStyles = css.create({
  none: { borderStartStartRadius: 0 },
  small: { borderStartStartRadius: '0.2em' },
  medium: { borderStartStartRadius: '0.45em' },
  large: { borderStartStartRadius: '0.8em' },
});

// 色块颜色与示例字号是任意值，用动态样式；单独一个 create，见 COMPONENTS.md §4
/** ThemeCustomizer 的动态样式：色块的颜色、缩放示例的字号 */
export const themeCustomizerDynamicStyles = css.create({
  fill: (color: string) => ({ backgroundColor: color }),
  scale: (factor: number) => ({ fontSize: `${factor}em` }),
});

/** 内置主题名 → 导出代码里的变量名（high-contrast → highContrastTheme）；不是内置主题时没有 */
function baseVariable(name: string): string | undefined {
  if (!(name in builtinThemes)) return undefined;
  return `${name.replace(/-(\w)/g, (_, letter: string) => letter.toUpperCase())}Theme`;
}

const SCALINGS = [0.9, 0.95, 1, 1.05, 1.1];

/** 一个选项：值、示意、名字、悬停提示 */
interface Option {
  value: string;
  preview?: VNodeChild;
  label: VNodeChild;
  title?: string;
}

/** 选项的排法：list 是示意加名字，swatches 只放色块 */
type OptionLayout = 'list' | 'swatches';

/** 主题编辑器：分组的旋钮、对比度检查与导出代码 */
export const ThemeCustomizer = _component(
  ({
    _settings: settings = _bindable<ThemeSettings>({}),
    base,
    contrastTarget,
    propsGroup,
    propsContrast,
    propsCode,
    propsDownload,
    propsDownloadTokens,
    propsReset,
    ...rest
  }: ThemeCustomizerProps) => {
    const messages = useMessages('themeCustomizer', themeCustomizerMessages);
    const format = useFormat();
    let issues = _state.raw<ContrastIssue[]>([]);

    /** 改一个旋钮：空值表示沿用主题本来的取值 */
    function set<Key extends keyof ThemeSettings>(key: Key, value: ThemeSettings[Key] | '') {
      settings = { ...settings, [key]: value === '' ? undefined : value };
    }

    // 设置或主题变了：等新主题写进页面，再读实际生效的颜色检查对比度
    watch(
      () => [settings, base],
      async () => {
        // 服务端渲染时 immediate 的侦听也会执行，页面上没有主题可读
        if (typeof document === 'undefined') return;
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

    /** 页面上实际生效的主题（已经套上这些设置）存成 Figma 变量能导入的设计令牌 */
    function downloadTokens(customized: boolean) {
      const name = `${base.name.replace(/-custom$/, '')}${customized ? '-custom' : ''}`;
      const tokens = elementDesignTokens(contrastTarget ?? document.documentElement);
      downloadFile(`${name}.tokens.json`, JSON.stringify(tokens, null, 2), 'application/json');
    }

    const group = (title: string, hint: string, children: VNodeChild) => (
      <section {...mergeAttrs<'section'>({ sx: themeCustomizerStyles.group }, propsGroup)}>
        <div {...css.attrs(themeCustomizerStyles.groupHeader)}>
          <Text weight="semibold">{title}</Text>
          <Text size="sm" tone="muted">
            {hint}
          </Text>
        </div>
        {children}
      </section>
    );

    /** 一个旋钮：名称与当前取值，下面是选项网格（单选、至少选一项） */
    const field = (
      label: string,
      current: VNodeChild,
      options: readonly Option[],
      value: string,
      onChange: (next: string) => void,
      layout: OptionLayout = 'list',
    ) => (
      <div {...css.attrs(themeCustomizerStyles.field)}>
        <div {...css.attrs(themeCustomizerStyles.fieldHeader)}>
          <Text size="sm" weight="medium">
            {label}
          </Text>
          <Text size="xs" tone="muted">
            {current}
          </Text>
        </div>
        <ToggleGroup
          _value={value}
          onUpdate:_value={onChange}
          required
          size="sm"
          aria-label={label}
          sx={[
            themeCustomizerStyles.options,
            layout === 'swatches' && themeCustomizerStyles.swatches,
          ]}
        >
          {options.map((option) => (
            <ToggleItem
              key={option.value}
              value={option.value}
              title={option.title}
              sx={[
                themeCustomizerStyles.option,
                layout === 'swatches' && themeCustomizerStyles.swatchOption,
              ]}
            >
              {layout === 'swatches' ? (
                <>
                  {option.preview}
                  <VisuallyHidden>{option.label}</VisuallyHidden>
                </>
              ) : (
                <span {...css.attrs(themeCustomizerStyles.optionContent)}>
                  {option.preview}
                  <span {...css.attrs(themeCustomizerStyles.optionLabel)}>{option.label}</span>
                </span>
              )}
            </ToggleItem>
          ))}
        </ToggleGroup>
      </div>
    );

    /** 色阶在当前语言下的名字与色值：“靛蓝 #3e63dd”；没选（主题默认）时是“主题默认” */
    const scaleText = (scale: AccentScale | NeutralScale | undefined) =>
      scale
        ? `${messages.colorNames[scale]} ${scaleSwatch(scale as never, base.colorScheme)}`
        : messages.themeDefault;

    /** 色阶选项：第一项是“主题默认”，其余是色块；名字与色值在悬停提示与读屏文字里 */
    const scaleOptions = (scales: readonly (AccentScale | NeutralScale)[]): Option[] => [
      {
        value: '',
        preview: (
          <span
            {...css.attrs(
              themeCustomizerStyles.swatch,
              themeCustomizerStyles.swatchLarge,
              themeCustomizerStyles.swatchDefault,
            )}
          />
        ),
        label: messages.themeDefault,
        title: messages.themeDefault,
      },
      ...scales.map((scale) => {
        const color = scaleSwatch(scale as never, base.colorScheme);
        return {
          value: scale,
          title: `${messages.colorNames[scale]}（${scale}）${color}`,
          preview: (
            <span
              {...css.attrs(
                themeCustomizerStyles.swatch,
                themeCustomizerStyles.swatchLarge,
                swatchStyles.ring,
                themeCustomizerDynamicStyles.fill(color),
              )}
            />
          ),
          label: messages.colorNames[scale],
        };
      }),
    ];

    return () => {
      const radii: [keyof RadiusPresets, string][] = [
        ['none', messages.radiusNone],
        ['small', messages.radiusSmall],
        ['medium', messages.radiusMedium],
        ['large', messages.radiusLarge],
      ];
      const fonts: [keyof FontPresets, string][] = [
        ['sans', messages.fontSans],
        ['serifHeadings', messages.fontSerifHeadings],
      ];
      const motions: [keyof MotionPresets, string][] = [
        ['none', messages.motionNone],
        ['fast', messages.motionFast],
        ['normal', messages.motionNormal],
        ['slow', messages.motionSlow],
      ];
      const radius = settings.radius ?? 'medium';
      const scaling = settings.scaling ?? 1;
      const font = settings.font ?? 'sans';
      const motion = settings.motion ?? 'normal';
      const percent = (factor: number) => format.number(factor, { style: 'percent' });
      const labelOf = <Key extends string>(list: [Key, string][], key: Key) =>
        list.find(([value]) => value === key)?.[1];
      const code = themeSettingsCode(
        baseVariable(base.name.replace(/-custom$/, '')) ??
          (base.colorScheme === 'dark' ? 'darkTheme' : 'lightTheme'),
        settings,
        base.colorScheme,
      );
      const customized = Object.values(settings).some((value) => value !== undefined);

      return (
        <div {...mergeAttrs<'div'>({ sx: themeCustomizerStyles.root }, rest)}>
          {group(messages.groupColor, messages.groupColorHint, [
            field(
              messages.accent,
              scaleText(settings.accent),
              scaleOptions(ACCENT_SCALES),
              settings.accent ?? '',
              (next) => set('accent', next as ThemeSettings['accent'] | ''),
              'swatches',
            ),
            field(
              messages.neutral,
              scaleText(settings.neutral),
              scaleOptions(NEUTRAL_SCALES),
              settings.neutral ?? '',
              (next) => set('neutral', next as ThemeSettings['neutral'] | ''),
              'swatches',
            ),
          ])}
          {group(messages.groupShape, messages.groupShapeHint, [
            field(
              messages.radius,
              labelOf(radii, radius),
              radii.map(([value, label]) => ({
                value,
                label,
                preview: (
                  <span
                    {...css.attrs(themeCustomizerStyles.corner, themeCustomizerCornerStyles[value])}
                  />
                ),
              })),
              radius,
              (next) => set('radius', next as keyof RadiusPresets),
            ),
            field(
              messages.scaling,
              percent(scaling),
              SCALINGS.map((factor) => ({
                value: String(factor),
                label: percent(factor),
                preview: (
                  <span
                    {...css.attrs(
                      themeCustomizerStyles.sample,
                      themeCustomizerDynamicStyles.scale(factor),
                    )}
                  >
                    Aa
                  </span>
                ),
              })),
              String(scaling),
              (next) => set('scaling', Number(next)),
            ),
          ])}
          {group(messages.groupType, messages.groupTypeHint, [
            field(
              messages.font,
              labelOf(fonts, font),
              fonts.map(([value, label]) => ({
                value,
                label,
                preview: (
                  <span
                    {...css.attrs(
                      themeCustomizerStyles.sample,
                      value === 'sans' ? themeCustomizerStyles.sans : themeCustomizerStyles.serif,
                    )}
                  >
                    Aa
                  </span>
                ),
              })),
              font,
              (next) => set('font', next as keyof FontPresets),
            ),
            field(
              messages.motion,
              labelOf(motions, motion),
              motions.map(([value, label]) => ({ value, label })),
              motion,
              (next) => set('motion', next as keyof MotionPresets),
            ),
          ])}
          {group(messages.groupExport, messages.groupExportHint, [
            <Alert
              {...mergePartProps<AlertProps>({ title: messages.contrast }, propsContrast, {
                tone: issues.length === 0 ? 'success' : 'warning',
              })}
            >
              {issues.length === 0 ? (
                messages.contrastOk(CONTRAST_PAIRS.length)
              ) : (
                <Flex direction="column" gap="xs">
                  {issues.map((issue) => (
                    <span key={`${issue.foreground}-${issue.background}`}>
                      {messages.contrastIssue(
                        `${issue.foreground} / ${issue.background}`,
                        format.number(issue.ratio, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }),
                        issue.minimum,
                      )}
                    </span>
                  ))}
                </Flex>
              )}
            </Alert>,
            <CodeBlock
              {...mergePartProps<CodeBlockProps>(
                { title: messages.code, code, lang: 'ts' },
                propsCode,
              )}
            />,
            <Flex gap="sm" wrap>
              <Button
                {...mergePartProps<ButtonProps>(
                  { variant: 'soft', icon: Download },
                  propsDownload,
                  { onClick: () => downloadFile('theme.ts', code, 'text/typescript') },
                )}
              >
                {messages.download}
              </Button>
              <Button
                {...mergePartProps<ButtonProps>(
                  { variant: 'soft', icon: FileBraces },
                  propsDownloadTokens,
                  { onClick: () => downloadTokens(customized) },
                )}
              >
                {messages.downloadTokens}
              </Button>
              <Button
                {...mergePartProps<ButtonProps>(
                  { variant: 'soft', tone: 'neutral', icon: RotateCcw, disabled: !customized },
                  propsReset,
                  { onClick: () => (settings = {}) },
                )}
              >
                {messages.reset}
              </Button>
            </Flex>,
          ])}
        </div>
      );
    };
  },
);
