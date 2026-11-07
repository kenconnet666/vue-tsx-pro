// 选主题：一组单选卡片，每张是主题自己的底色、表面、主色画的缩略图（设置页、引导流程）
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  builtinThemeLabel,
  builtinThemes,
  Radio,
  RadioGroup,
  Small,
  useLang,
  type BuiltinThemeName,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { ThemeThumbnail } from '@zerodep-dev/vue-tsx-pro-ui/theme-customize';

const names = Object.keys(builtinThemes) as BuiltinThemeName[];

export default _component(() => {
  const lang = useLang();
  let picked = _state<string | null>('paper');
  return () => (
    <RadioGroup
      _value={picked}
      card
      orientation="horizontal"
      minItemWidth="10rem"
      aria-label="选择主题"
    >
      {names.map((name) => (
        <Radio key={name} value={name}>
          <ThemeThumbnail theme={builtinThemes[name]} />
          <Small>{builtinThemeLabel(lang, name)}</Small>
        </Radio>
      ))}
    </RadioGroup>
  );
});
