/**
 * 图标库：搜索并点选 @lucide/icons 里的图标。Icon 文档页的“图标库”与组件演练场的图标控件共用。
 *
 *   <IconGallery value={_bind(name)} />   // value 是导入名（Search），点选后更新
 *
 * Lucide 没有随包提供分类与关键词，按名字搜：导入名（ArrowRight）与文件名（arrow-right）都能匹配。
 * 一次最多画出 LIMIT 个，其余提示“继续输入缩小范围”：一千多个按钮全画出来，打开时会卡一下。
 */
import * as lucide from '@lucide/icons';
import { Search } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { Flex, Icon, Small, TextField, type IconData } from '@vue-tsx-pro/ui';

const LIMIT = 240;

/** arrow-right → ArrowRight：图标的规范导入名 */
const pascal = (slug: string) =>
  slug.replace(/(^|-)([a-z0-9])/g, (_, __, c: string) => c.toUpperCase());

/**
 * 全部图标：导入名、文件名与数据。同一个图标有几个导出（Rocket、RocketIcon、LucideRocket），
 * 都指向同一份数据，只留规范名
 */
export const allIcons: readonly { name: string; slug: string; icon: IconData }[] = (() => {
  const byData = new Map<unknown, { name: string; slug: string; icon: IconData }>();
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

const styles = stylex.create({
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(2.75rem, 1fr))',
    gap: '_xs',
    maxHeight: '22rem',
    overflowY: 'auto',
    padding: '_xs',
  },
  cell: {
    display: 'grid',
    placeItems: 'center',
    aspectRatio: '1',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: { default: 'transparent', ':hover': '_border' },
    borderRadius: '_md',
    backgroundColor: { default: 'transparent', ':hover': '_fillHover' },
    color: '_text',
    fontSize: '1.25rem',
    cursor: 'pointer',
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

  return () => (
    <Flex direction="column" gap="sm">
      <TextField
        value={_bind(query)}
        icon={Search}
        clearable
        placeholder={`搜索 ${allIcons.length} 个图标，如 arrow、user、chart`}
        aria-label="搜索图标"
      />
      <div {...stylex.attrs(styles.grid)}>
        {matches.slice(0, LIMIT).map((item) => (
          <button
            key={item.name}
            type="button"
            aria-pressed={item.name === value}
            title={item.name}
            {...stylex.attrs(styles.cell, item.name === value && styles.selected)}
            onClick={() => {
              value = item.name;
              onPick?.(item.name);
            }}
          >
            <Icon icon={item.icon} aria-label={item.name} />
          </button>
        ))}
      </div>
      <Small tone="muted">
        {matches.length === 0
          ? '没有匹配的图标：换个英文关键词试试'
          : matches.length > LIMIT
            ? `共 ${matches.length} 个，显示前 ${LIMIT} 个；继续输入缩小范围`
            : `共 ${matches.length} 个`}
      </Small>
    </Flex>
  );
});
