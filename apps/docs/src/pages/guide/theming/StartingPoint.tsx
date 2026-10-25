/** 主题定制页：先选一套内置主题作为起点（就是站点的主题偏好），编辑器的设置叠在它上面 */
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import {
  builtinThemeLabel,
  builtinThemes,
  Text,
  ToggleGroup,
  ToggleItem,
  useLang,
  type BuiltinThemeName,
} from '@vue-tsx-pro/ui';
import { ThemeThumbnail } from '@vue-tsx-pro/ui/theme-customize';
import { preference } from '../../../site/theme';

const styles = css.create({
  root: { display: 'flex', flexDirection: 'column', gap: '_sm' },
  header: { display: 'flex', flexDirection: 'column', gap: '_xs' },
  options: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(6.5em, 1fr))',
    gap: '_xs',
  },
  // 一项是一张小卡片：缩略图在上、名字在下（排列写在按钮的内容部件上）
  option: { height: 'auto', minWidth: 0, paddingBlock: '_xs', paddingInline: '_xs' },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: '_xs',
    width: '100%',
    minWidth: 0,
  },
  thumbnail: {
    width: '100%',
    height: 'auto',
    aspectRatio: '8 / 5',
    outlineWidth: '_borderWidths.md',
    outlineStyle: 'solid',
    outlineColor: 'transparent',
    outlineOffset: '1px',
    transitionProperty: 'outline-color',
    transitionDuration: '_durations.sm',
  },
  // 选中的起点：缩略图外一圈品牌色
  selected: { outlineColor: '_accent' },
  label: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    textAlign: 'center',
  },
});

export const StartingPoint = _component(() => {
  const lang = useLang();
  return () => (
    <div {...css.attrs(styles.root)}>
      <div {...css.attrs(styles.header)}>
        <Text weight="semibold">起点</Text>
        <Text size="sm" tone="muted">
          选一套内置主题打底，下面的调整叠在它上面；也就是右上角的主题切换
        </Text>
      </div>
      <ToggleGroup
        _value={_bind(
          () => preference.name,
          (next) => void preference.set(next),
        )}
        required
        size="sm"
        aria-label="起点主题"
        sx={styles.options}
      >
        {(Object.keys(builtinThemes) as BuiltinThemeName[]).map((name) => (
          <ToggleItem
            key={name}
            value={name}
            sx={styles.option}
            propsContent={{ sx: styles.content }}
          >
            <ThemeThumbnail
              theme={builtinThemes[name]}
              sx={[styles.thumbnail, preference.name === name && styles.selected]}
            />
            <span {...css.attrs(styles.label)}>{builtinThemeLabel(lang, name)}</span>
          </ToggleItem>
        ))}
      </ToggleGroup>
    </div>
  );
});
