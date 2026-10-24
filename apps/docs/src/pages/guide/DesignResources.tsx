/**
 * 指南：设计资源。每套内置主题导出成 Figma 变量（DTCG JSON，点了才在浏览器里生成）、导入步骤与换算规则、
 * Figma 设计文件里有什么、图标从哪里来
 */
import { Download } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import {
  Alert,
  builtinThemeLabel,
  builtinThemes,
  Button,
  Card,
  Code,
  downloadFile,
  Flex,
  Grid,
  H2,
  Link,
  LinkButton,
  List,
  ListItem,
  OrderedList,
  Paragraph,
  Small,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
  useLang,
  type BuiltinThemeName,
} from '@vue-tsx-pro/ui';
import { ThemeThumbnail, themeDesignTokens } from '@vue-tsx-pro/ui/theme-customize';
import { DocPage } from '../../site/DocPage';

const meta = {
  title: 'Design Resources 设计资源',
  description:
    '每套内置主题都能导出成 Figma 变量（DTCG 格式的 JSON），与代码里的 token 一一对应；Figma 设计文件里有文字样式、阴影、图标与常用组件。',
};

const FIGMA_FILE = 'https://www.figma.com/design/UTDP9KBNhelTIK1KoMlHYk';

const styles = css.create({
  thumbnail: { width: '100%', height: 'auto', aspectRatio: '8 / 5' },
  themeCard: { display: 'flex', flexDirection: 'column', gap: '_sm' },
  // 类型只有两三个字，不跟着说明一起折行
  nowrap: { whiteSpace: 'nowrap' },
});

/** token 组在 Figma 里成为什么类型的变量、怎么换算 */
const conversions: [groups: string, type: string, rule: string][] = [
  ['colors', '颜色', 'sRGB，带透明度'],
  [
    'space、radii、sizes、fontSizes、letterSpacings、borderWidths',
    '数字',
    'Figma 只认 px：em 乘主题的 md 字号（内置主题都是 14px），rem 乘根元素字号（16px）；sizes.full（100%）没有固定长度，不导出',
  ],
  ['fontWeights、lineHeights、opacities、strokeWidths', '数字', '原样'],
  ['durations', '数字', '换成秒（Figma 只认 s）'],
  [
    'fonts',
    '字符串',
    'Figma 里没有系统字体：取字体栈里 Figma 自带的 Noto Sans SC、Noto Serif SC 或 JetBrains Mono',
  ],
  [
    'shadows、easings',
    '不导入',
    'Figma 变量没有这两种类型；文件里按 DTCG 的 shadow、cubicBezier 写出，给 Style Dictionary 这类工具用',
  ],
];

/** 一套主题的设计令牌存成 <主题名>.tokens.json */
function download(name: BuiltinThemeName) {
  const tokens = themeDesignTokens(builtinThemes[name]);
  downloadFile(`${name}.tokens.json`, JSON.stringify(tokens, null, 2), 'application/json');
}

export default _component(() => {
  const lang = useLang();
  return () => (
    <DocPage meta={meta}>
      <Flex direction="column" gap="md">
        <H2 id="variables" size="xl" anchor>
          Figma 变量
        </H2>
        <Paragraph>
          一套主题一个文件（<Code>light.tokens.json</Code>、<Code>dark.tokens.json</Code>
          ……），取值就是页面上实际生效的 token，名字按组分好：
          <Code>colors/accent</Code>、<Code>space/md</Code>，对应代码里的 <Code>_accent</Code>、
          <Code>_space.md</Code>。调过品牌色、圆角的主题，在
          <Link href="/guide/theming#customize">主题定制</Link>的“检查与导出”里下载。
        </Paragraph>
        <Grid minItemWidth="10rem" gap="md">
          {(Object.keys(builtinThemes) as BuiltinThemeName[]).map((name) => (
            <Card key={name} variant="outline" padding="sm" propsBody={{ sx: styles.themeCard }}>
              <ThemeThumbnail theme={builtinThemes[name]} sx={styles.thumbnail} />
              <Flex align="baseline" justify="between" gap="sm">
                <Text size="sm" weight="medium">
                  {builtinThemeLabel(lang, name)}
                </Text>
                <Small tone="muted">{name}</Small>
              </Flex>
              <Button
                size="sm"
                variant="soft"
                icon={Download}
                aria-label={`下载${builtinThemeLabel(lang, name)}主题的 Figma 变量（${name}.tokens.json）`}
                onClick={() => download(name)}
              >
                下载
              </Button>
            </Card>
          ))}
        </Grid>
      </Flex>

      <Flex direction="column" gap="md">
        <H2 id="import" size="xl" anchor>
          导入 Figma
        </H2>
        <OrderedList gap="sm">
          <ListItem>下载要用的主题，一个文件就是一个模式（亮色、暗色……）。</ListItem>
          <ListItem>
            在 Figma
            的变量面板里导入：导入成新的集合时，每个文件成为集合里的一个模式；已有的模式上右键选
            Import mode，按名字更新取值。
          </ListItem>
          <ListItem>
            一个集合能有几个模式取决于 Figma 的套餐：免费的 Starter
            只有一个，其余主题放进各自的集合。
          </ListItem>
        </OrderedList>
        <Table aria-label="token 组在 Figma 里的类型与换算">
          <TableHead>
            <TableRow>
              <TableHeaderCell>token 组</TableHeaderCell>
              <TableHeaderCell sx={styles.nowrap}>Figma 变量</TableHeaderCell>
              <TableHeaderCell>换算</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {conversions.map(([groups, type, rule]) => (
              <TableRow key={groups}>
                <TableCell>
                  <Code>{groups}</Code>
                </TableCell>
                <TableCell sx={styles.nowrap}>{type}</TableCell>
                <TableCell>{rule}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Flex>

      <Flex direction="column" gap="md">
        <H2 id="figma-file" size="xl" anchor>
          Figma 设计文件
        </H2>
        <Paragraph>
          组件库在 Figma 里的对应物：变量绑在组件的颜色、间距与圆角上，组件的属性与代码里的 props
          同名。打开需要文件的访问权限。
        </Paragraph>
        <List gap="sm">
          <ListItem>
            变量：亮色主题的 74 个颜色、25
            个尺寸；暗色的颜色在单独的集合里（免费版一个集合只有一个模式）。
          </ListItem>
          <ListItem>
            样式：13 个文字样式（正文、标签、标题、等宽）与 5 档阴影；字号按 14px 的基准换成
            px，字体用 Noto Sans SC 与 JetBrains Mono。
          </ListItem>
          <ListItem>图标：降本管理用到的 40 个 Lucide 图标，都是组件，描边颜色跟着变量。</ListItem>
          <ListItem>
            组件：Button、IconButton、Badge、StatusBadge、Checkbox、Avatar、Tab、NavItem、Input
            与表格的表头、单元格；降本管理的顶栏品牌格、顶栏工具与分页。
          </ListItem>
        </List>
        <Flex>
          <LinkButton href={FIGMA_FILE} external variant="soft">
            在 Figma 里打开
          </LinkButton>
        </Flex>
        <Alert tone="info">降本管理的界面稿会随应用重做一起画。</Alert>
      </Flex>

      <Flex direction="column" gap="md">
        <H2 id="icons" size="xl" anchor>
          图标
        </H2>
        <Paragraph>
          组件里的图标来自{' '}
          <Link href="https://lucide.dev" external>
            Lucide
          </Link>
          （<Code>@lucide/icons</Code>），Figma 里用 Lucide
          的插件或社区文件，名字与代码里一致；用法见 <Link href="/components/icon">Icon 图标</Link>
          。
        </Paragraph>
      </Flex>
    </DocPage>
  );
});
