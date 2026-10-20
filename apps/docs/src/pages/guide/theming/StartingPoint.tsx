/** 主题定制页：先选一套内置主题作为起点（就是站点的主题偏好），编辑器的设置叠在它上面 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  builtinThemes,
  swatchStyles,
  Text,
  themeAttrs,
  ToggleGroup,
  ToggleItem,
  useLang,
  type BuiltinThemeName,
  type Lang,
} from '@vue-tsx-pro/ui';
import { preference } from '../../../site/theme';

const styles = stylex.create({
  root: { display: 'flex', flexDirection: 'column', gap: '_sm' },
  header: { display: 'flex', flexDirection: 'column', gap: '_xs' },
  options: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(7.5em, 1fr))' },
  option: { justifyContent: 'flex-start', minWidth: 0 },
  content: { display: 'flex', alignItems: 'center', gap: '_sm', minWidth: 0 },
  label: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  // 缩略图：这套主题的页面底色上放一个品牌色圆点；颜色来自套在它上面的主题变量
  thumbnail: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: '1.5em',
    height: '1.5em',
    borderRadius: '_sm',
    backgroundColor: '_background',
  },
  dot: { width: '0.7em', height: '0.7em', borderRadius: '_full', backgroundColor: '_accent' },
});

/** 主题名 → 语言包里的名字：high-contrast → themeHighContrast */
function labelOf(lang: Lang, name: BuiltinThemeName): string {
  const key = `theme${name.replace(/(^|-)(\w)/g, (_, _dash: string, letter: string) => letter.toUpperCase())}`;
  return (lang as unknown as Record<string, string>)[key] ?? name;
}

export const StartingPoint = _component(() => {
  const lang = useLang();
  return () => (
    <div {...stylex.attrs(styles.root)}>
      <div {...stylex.attrs(styles.header)}>
        <Text weight="semibold">起点</Text>
        <Text size="sm" tone="muted">
          选一套内置主题打底，下面的调整叠在它上面；也就是右上角的主题切换
        </Text>
      </div>
      <ToggleGroup
        value={preference.name}
        {...{
          'onUpdate:value': (next: BuiltinThemeName) => void preference.set(next),
        }}
        required
        size="sm"
        aria-label="起点主题"
        sx={styles.options}
      >
        {(Object.keys(builtinThemes) as BuiltinThemeName[]).map((name) => {
          const { class: themeClass, style } = themeAttrs(builtinThemes[name]);
          return (
            <ToggleItem key={name} value={name} sx={styles.option}>
              <span {...stylex.attrs(styles.content)}>
                <span
                  class={[stylex.attrs(styles.thumbnail, swatchStyles.ring).class, themeClass]}
                  style={style}
                >
                  <span {...stylex.attrs(styles.dot)} />
                </span>
                <span {...stylex.attrs(styles.label)}>{labelOf(lang, name)}</span>
              </span>
            </ToggleItem>
          );
        })}
      </ToggleGroup>
    </div>
  );
});
