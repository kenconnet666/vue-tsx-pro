// 主题缩略图：用主题自己的底色、表面、主色画一张小卡片，做“选主题”的网格（设置页、引导流程）
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  builtinThemeLabel,
  builtinThemes,
  ButtonBase,
  GridList,
  Small,
  useLang,
  type BuiltinThemeName,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { ThemeThumbnail } from '@zerodep-dev/vue-tsx-pro-ui/theme-customize';

const names = Object.keys(builtinThemes) as BuiltinThemeName[];

const styles = css.create({
  option: {
    display: 'grid',
    gap: '_xs',
    width: '_full',
    padding: '_xs',
    borderRadius: '_md',
    borderWidth: '_sm',
    borderStyle: 'solid',
    borderColor: { default: 'transparent', ':hover': '_border' },
    textAlign: 'start',
  },
  selected: { borderColor: { default: '_accent', ':hover': '_accent' } },
});

export default _component(() => {
  const lang = useLang();
  let picked = _state<BuiltinThemeName>('paper');
  return () => (
    <GridList minItemWidth="8rem" gap="sm" aria-label="选择主题">
      {names.map((name) => (
        <li key={name}>
          <ButtonBase
            sx={[styles.option, picked === name && styles.selected]}
            aria-pressed={picked === name}
            onClick={() => (picked = name)}
          >
            <ThemeThumbnail theme={builtinThemes[name]} />
            <Small>{builtinThemeLabel(lang, name)}</Small>
          </ButtonBase>
        </li>
      ))}
    </GridList>
  );
});
