/**
 * 顶栏的字体切换：图标按钮弹出单选菜单（同主题切换），在系统字体（默认）、等距更纱黑体 SC、霞鹜文楷等宽之间换。
 * 选择与加载见 fonts.ts。
 */
import { Type } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { IconButton, Menu, MenuRadioGroup, MenuRadioItem } from '@zerodep-dev/vue-tsx-pro-ui';
import { siteFont, siteFonts, type SiteFontName } from './fonts';

export const FontSwitcher = _component(() => {
  return () => (
    <Menu trigger={(props) => <IconButton {...props} icon={Type} aria-label="字体" />}>
      <MenuRadioGroup
        _value={siteFont.value}
        onUpdate:_value={(name: SiteFontName) => (siteFont.value = name)}
        aria-label="字体"
      >
        {(Object.keys(siteFonts) as SiteFontName[]).map((name) => (
          <MenuRadioItem key={name} value={name}>
            {siteFonts[name].label}
          </MenuRadioItem>
        ))}
      </MenuRadioGroup>
    </Menu>
  );
});
