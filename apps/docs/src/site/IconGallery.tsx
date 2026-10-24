/**
 * 图标库：搜索并点选 @lucide/icons 里的图标。Icon 文档页的“图标库”与组件演练场的图标控件共用。
 *
 *   <IconGallery value={_bind(name)} />   // value 是导入名（Search），点选后更新
 *
 * Lucide 没有随包提供分类与关键词，按名字搜：导入名（ArrowRight）与文件名（arrow-right）都能匹配。
 * 全部图标都能滚动看到：按行虚拟滚动（VirtualList），每行放几个按容器宽度算，只画看得见的几行。
 */
import * as lucide from '@lucide/icons';
import { Search } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import {
  ButtonBase,
  Flex,
  Grid,
  Icon,
  iconMarkup,
  Small,
  TextField,
  useResizeObserver,
  VirtualList,
  type IconData,
} from '@vue-tsx-pro/ui';

/** 一格的最小宽度与格间距（px，同 gap 的 xs 档）：据此算每行放几个 */
const CELL = 88;
const GAP = 4;
/** 一行的估计高度（px）：图标、名字与上下内边距 */
const ROW = 68;

/** arrow-right → ArrowRight：图标的规范导入名 */
const pascal = (slug: string) =>
  slug.replace(/(^|-)([a-z0-9])/g, (_, __, c: string) => c.toUpperCase());

/** 图标库里的一项：导入名、文件名与数据 */
export interface IconEntry {
  name: string;
  slug: string;
  icon: IconData;
}

/**
 * 全部图标。同一个图标有几个导出（Rocket、RocketIcon、LucideRocket），
 * 都指向同一份数据，只留规范名
 */
export const allIcons: readonly IconEntry[] = (() => {
  const byData = new Map<unknown, IconEntry>();
  for (const [name, value] of Object.entries(lucide)) {
    const data = value as Partial<IconData> & { name?: string };
    if (!Array.isArray(data?.node)) continue;
    const slug = data.name ?? name;
    const known = byData.get(value);
    if (!known || name === pascal(slug)) byData.set(value, { name, slug, icon: value as IconData });
  }
  return [...byData.values()].sort((a, b) => a.name.localeCompare(b.name));
})();

/** 按导入名找图标数据 */
export const iconByName = (name: string): IconData | undefined =>
  (lucide as unknown as Record<string, IconData | undefined>)[name];

/** 完整的 SVG 文件：Lucide 的标准属性（24 格、描边跟随文字色），可以直接粘到设计稿或别的项目里 */
export function iconSvg(icon: IconData, strokeWidth = 2): string {
  const width = icon.width ?? icon.size ?? 24;
  const height = icon.height ?? icon.size ?? 24;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"`,
    `  fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">`,
    `  ${iconMarkup(icon)}`,
    `</svg>`,
  ].join('\n');
}

const styles = css.create({
  // VirtualList 自己是滚动容器（内部是 ScrollArea，滚动条和整页一样）
  scroller: { height: '26rem' },
  // 行与行之间的间距：VirtualList 的每一项就是一行
  row: { paddingBlockEnd: '_xs' },
  // 一格：图标在上，名字在下（长名字截断，完整名字在 title 里）；去默认外观、焦点环、过渡由 ButtonBase 给
  cell: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '_xs',
    minWidth: 0,
    paddingBlock: '_sm',
    paddingInline: '_xs',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: { default: 'transparent', ':hover': '_border' },
    borderRadius: '_md',
    backgroundColor: { default: 'transparent', ':hover': '_fillHover' },
    color: '_text',
  },
  glyph: { fontSize: '1.375rem' },
  name: {
    maxWidth: '_full',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: '0.6875rem',
    color: '_textMuted',
  },
  selected: {
    borderColor: '_accentBorder',
    backgroundColor: '_accentSoft',
    color: '_accentText',
  },
});

/** IconGallery 的属性 */
export interface IconGalleryProps {
  /** 选中的图标（导入名）：父级可以写 value={_bind(x)} */
  value?: string;
  /** 点选了一个图标 */
  onPick?: (name: string) => void;
}

/** 图标库：搜索框与图标网格 */
export const IconGallery = _component(({ value = _bindable(''), onPick }: IconGalleryProps) => {
  let query = _state('');
  const matches = _derived.by(() => {
    const keyword = query
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, '-');
    if (!keyword) return allIcons;
    const compact = keyword.replace(/-/g, '');
    return allIcons.filter(
      (item) => item.slug.includes(keyword) || item.name.toLowerCase().includes(compact),
    );
  });

  // 每行放几个：随容器宽度变（窄屏、演练场的弹层里少，文档页里多）
  let frame = _state.raw<HTMLElement | null>(null);
  let columns = _state(6);
  useResizeObserver(
    () => frame,
    ([entry]) => {
      const width = entry?.contentRect.width ?? 0;
      if (width > 0) columns = Math.max(1, Math.floor((width + GAP) / (CELL + GAP)));
    },
  );
  const rows = _derived.by(() => {
    const result: IconEntry[][] = [];
    for (let start = 0; start < matches.length; start += columns) {
      result.push(matches.slice(start, start + columns));
    }
    return result;
  });

  return () => (
    <Flex direction="column" gap="sm">
      <TextField
        value={_bind(query)}
        icon={Search}
        clearable
        placeholder={`搜索 ${allIcons.length} 个图标，如 arrow、user、chart`}
        aria-label="搜索图标"
      />
      <div ref={_toRef(frame)}>
        <VirtualList
          items={rows}
          getKey={(row) => row[0]!.name}
          estimateSize={ROW}
          sx={styles.scroller}
        >
          {(row) => (
            <Grid columns={columns} gap="xs" sx={styles.row}>
              {row.map((item) => (
                <ButtonBase
                  key={item.name}
                  aria-pressed={item.name === value}
                  title={item.name}
                  sx={[styles.cell, item.name === value && styles.selected]}
                  onClick={() => {
                    value = item.name;
                    onPick?.(item.name);
                  }}
                >
                  <Icon icon={item.icon} sx={styles.glyph} />
                  <span {...css.attrs(styles.name)}>{item.name}</span>
                </ButtonBase>
              ))}
            </Grid>
          )}
        </VirtualList>
      </div>
      <Small tone="muted">
        {matches.length === 0
          ? '没有匹配的图标：换个英文关键词试试'
          : `共 ${matches.length} 个，滚动查看全部`}
      </Small>
    </Flex>
  );
});
