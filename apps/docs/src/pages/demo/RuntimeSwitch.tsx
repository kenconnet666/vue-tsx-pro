import { Monitor } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  Badge,
  builtinThemeLabel,
  builtinThemes,
  Button,
  Card,
  createThemePreference,
  Flex,
  Icon,
  Provider,
  Text,
  ThemeSwitcher,
  ThemeThumbnail,
  ToggleGroup,
  ToggleItem,
  useLang,
  type BuiltinThemeName,
} from '@vue-tsx-pro/ui';

const styles = stylex.create({
  // 主题卡片排成网格：宽屏一行六张
  options: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(7em, 1fr))',
    gap: '_xs',
  },
  option: { height: 'auto', paddingBlock: '_xs', paddingInline: '_xs' },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: '_xs',
    width: '100%',
  },
  thumbnail: { width: '100%', height: 'auto', aspectRatio: '8 / 5' },
  // 跟随系统：没有固定的主题，画一块半亮半暗的底
  system: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: '8 / 5',
    borderRadius: '_md',
    backgroundImage: 'linear-gradient(135deg, #f8f8f8 50%, #1c1c1f 50%)',
    color: '#8a8a8a',
  },
});

export default _component(() => {
  const lang = useLang();
  // 应用里一般在创建应用前调用一次，交给 createUi；这里只管这一块，也不记到本地存储
  const preference = createThemePreference({ themes: builtinThemes, storageKey: false });
  const names = Object.keys(builtinThemes) as BuiltinThemeName[];

  return () => (
    <Provider theme={preference.theme}>
      <Card>
        <Flex direction="column" gap="md">
          <Flex align="center" justify="between" gap="sm" wrap>
            <Flex align="center" gap="sm">
              <Text weight="semibold">外观</Text>
              <Badge variant="soft">
                {preference.preference === 'system'
                  ? `${lang.themeSystem} · ${builtinThemeLabel(lang, preference.name)}`
                  : builtinThemeLabel(lang, preference.name)}
              </Badge>
            </Flex>
            {/* 顶栏里常见的紧凑写法：一个按钮打开菜单 */}
            <ThemeSwitcher preference={preference} />
          </Flex>
          <ToggleGroup
            value={_bind(
              () => preference.preference,
              (next) => void preference.set(next),
            )}
            required
            size="sm"
            aria-label="主题"
            sx={styles.options}
          >
            <ToggleItem value="system" sx={styles.option} propsContent={{ sx: styles.content }}>
              <span {...stylex.attrs(styles.system)}>
                <Icon icon={Monitor} />
              </span>
              {lang.themeSystem}
            </ToggleItem>
            {names.map((name) => (
              <ToggleItem
                key={name}
                value={name}
                sx={styles.option}
                propsContent={{ sx: styles.content }}
              >
                <ThemeThumbnail theme={builtinThemes[name]} sx={styles.thumbnail} />
                {builtinThemeLabel(lang, name)}
              </ToggleItem>
            ))}
          </ToggleGroup>
          <Flex gap="sm" justify="end">
            <Button variant="soft">取消</Button>
            <Button>应用</Button>
          </Flex>
        </Flex>
      </Card>
    </Provider>
  );
});
