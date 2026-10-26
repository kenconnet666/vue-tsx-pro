/**
 * 人员与组织选择面板：左边按组织架构一层层找（面包屑回到上层），或搜索、看岗位与最近选过的，勾选；右边是已选的，可以移除、清空。
 * PeoplePicker 把它放进对话框；也可以直接放在页面、抽屉里。数据见 people.ts（source）。
 *
 *   <PeoplePickerPanel source={source} _value={members} types={['user', 'department']} recentKey="project-members" />
 *
 * - 部门的“下级”进到下一层（不能选部门时点整行也是进去），面包屑点哪一级回到哪一级。
 * - 搜索框有字时列表换成搜索结果（输入停下 300 ms 再搜，只采用最后一次），清空回到原来的页。
 * - types 决定能勾哪几种；max 限制个数，1 时勾一个就换掉原来的。勾过的记进“最近”（recentKey，存在浏览器里，最多 20 个）。
 * - 多选时列表上方有“全选”，只管这一页能勾的。
 *
 * 读屏：左右两个列表各有名称；每行的勾选框以名字为名；“下级”按钮的名称是“下级：某部门”，进去后焦点落到列表上。
 * 部件：Root（div）、Browse（左边）、Selected（右边）。
 */
import { Building, BriefcaseBusiness, ChevronRight, Search, X } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { nextTick, ref, watch, type Ref, type VNodeChild } from 'vue';
import { Button } from '../base/Button';
import { Icon } from '../base/Icon';
import { IconButton } from '../base/IconButton';
import { Spinner } from '../base/Spinner';
import { Small, Strong } from '../base/Text';
import { useLang } from '../config/context';
import { Avatar } from '../display/Avatar';
import { ItemList, ItemListItem } from '../display/ItemList';
import { Breadcrumbs } from '../navigation/Breadcrumbs';
import { usePersistentState } from '../utils/dom/storage';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { useRequest } from '../utils/request/use-request';
import { Checkbox } from './Checkbox';
import {
  peopleKey,
  toPeopleValue,
  type PeopleEntry,
  type PeopleSource,
  type PeopleType,
} from './people';
import { TextField, type TextFieldProps } from './TextField';
import { ToggleGroup, ToggleItem } from './ToggleGroup';

/** 未声明的属性落到外层 div 上 */
export interface PeoplePickerPanelProps extends PartProps<'div'> {
  /** 数据来源 */
  source: PeopleSource;
  /** 选中的：父级写 _value={list} 双向绑定 */
  _value?: readonly PeopleEntry[];
  /** 能选哪几种，默认只有人员 */
  types?: readonly PeopleType[];
  /** 最多选几个；1 时勾一个就换掉原来的 */
  max?: number;
  /** 记“最近选过的”用的键（存在浏览器里）；不写时没有“最近”页 */
  recentKey?: string;
  /** 两边列表的高度（CSS 长度），默认 '20rem' */
  listHeight?: string;
  /** 左边的部件属性 */
  propsBrowse?: PartProps<'div'>;
  /** 右边的部件属性 */
  propsSelected?: PartProps<'div'>;
  /** 搜索框的部件属性 */
  propsSearch?: Partial<TextFieldProps>;
}

type Page = 'org' | 'positions' | 'recent';

/** “最近”最多记几个 */
const RECENT_LIMIT = 20;

/** PeoplePickerPanel 的样式：root、grid、browse、selected、header、list、start */
export const peoplePickerPanelStyles = css.create({
  // 按自己的宽度决定左右排还是上下排
  root: { containerType: 'inline-size', minWidth: 0 },
  grid: {
    display: 'grid',
    gap: '_md',
    gridTemplateColumns: {
      default: 'minmax(0, 1fr)',
      '@container (min-width: 36rem)': 'minmax(0, 3fr) minmax(0, 2fr)',
    },
  },
  browse: { display: 'flex', flexDirection: 'column', gap: '_sm', minWidth: 0 },
  selected: {
    display: 'flex',
    flexDirection: 'column',
    gap: '_sm',
    minWidth: 0,
    padding: '_sm',
    backgroundColor: '_surfaceMuted',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_borderMuted',
    borderRadius: '_md',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '_sm',
    minHeight: '2em',
  },
  list: { overflowY: 'auto', outlineStyle: 'none', minWidth: 0 },
  start: { display: 'flex', alignItems: 'center', gap: '_sm' },
  status: { display: 'flex', justifyContent: 'center', paddingBlock: '_lg', color: '_textMuted' },
});

/** 随属性变的样式：列表的高度 */
export const peoplePickerPanelDynamicStyles = css.create({
  height: (height: string) => ({ height }),
});

/** 人员与组织选择面板 */
export const PeoplePickerPanel = _component(
  ({
    source,
    _value: value = _bindable<readonly PeopleEntry[]>([]),
    types = ['user'],
    max,
    recentKey,
    listHeight = '20rem',
    propsBrowse,
    propsSelected,
    propsSearch,
    ...rest
  }: PeoplePickerPanelProps) => {
    const lang = useLang();
    // 存的键只在创建时取：换键要换一个面板
    const key = _untrack(recentKey);
    let recent = _fromRef(
      key
        ? usePersistentState<PeopleEntry[]>(`vtp.people.recent.${key}`, [])
        : (ref<PeopleEntry[]>([]) as Ref<PeopleEntry[]>),
    );
    let page = _state<Page>('org');
    let query = _state('');
    let path = _state<PeopleEntry[]>([]);
    let list = _state.raw<HTMLElement | null>(null);

    const searching = () => !!source.search && query.trim() !== '';
    const level = useRequest(
      (parent: PeopleEntry | null, signal) => source.children(parent, signal),
      { params: () => path.at(-1) ?? null, keepPrevious: false },
    );
    const found = useRequest((text: string, signal) => source.search!(text, signal), {
      params: () => query.trim(),
      debounce: 300,
      immediate: false,
      keepPrevious: false,
      enabled: searching,
    });
    const positions = useRequest((_: undefined, signal) => source.positions!(signal), {
      immediate: false,
    });
    watch(
      () => page,
      (next) => {
        if (next === 'positions' && positions.data == null && !positions.loading) {
          void positions.refresh();
        }
      },
    );

    const pages = (): Page[] => [
      'org',
      ...(source.positions ? (['positions'] as const) : []),
      ...(key ? (['recent'] as const) : []),
    ];
    const pageLabel: Record<Page, () => string> = {
      org: () => lang.peopleOrg,
      positions: () => lang.peoplePositions,
      recent: () => lang.peopleRecent,
    };

    /** 现在列出的：搜索结果，或当前页 */
    const shown = (): { items: readonly PeopleEntry[]; loading: boolean } => {
      if (searching()) return { items: found.data ?? [], loading: found.loading };
      if (page === 'positions') return { items: positions.data ?? [], loading: positions.loading };
      if (page === 'recent') return { items: recent, loading: false };
      return { items: level.data ?? [], loading: level.loading };
    };

    const selectedKeys = _derived(new Set(value.map(peopleKey)));
    const pickable = (entry: PeopleEntry) => types.includes(entry.type);
    const drillable = (entry: PeopleEntry) =>
      entry.type === 'department' && entry.hasChildren !== false;
    const full = () => max != null && max > 1 && value.length >= max;

    function remember(entry: PeopleEntry) {
      if (!key) return;
      recent = [
        toPeopleValue(entry),
        ...recent.filter((item) => peopleKey(item) !== peopleKey(entry)),
      ].slice(0, RECENT_LIMIT);
    }

    function toggle(entry: PeopleEntry) {
      const id = peopleKey(entry);
      if (selectedKeys.has(id)) {
        value = value.filter((item) => peopleKey(item) !== id);
        return;
      }
      if (max === 1) value = [toPeopleValue(entry)];
      else if (full()) return;
      else value = [...value, toPeopleValue(entry)];
      remember(entry);
    }

    /** 全选这一页能勾的；都勾上了时全部取消。有上限时加到满为止 */
    function toggleAll(items: readonly PeopleEntry[]) {
      const candidates = items.filter(pickable);
      if (candidates.every((entry) => selectedKeys.has(peopleKey(entry)))) {
        const drop = new Set(candidates.map(peopleKey));
        value = value.filter((item) => !drop.has(peopleKey(item)));
        return;
      }
      const adding = candidates.filter((entry) => !selectedKeys.has(peopleKey(entry)));
      const room = max != null ? Math.max(0, max - value.length) : adding.length;
      value = [...value, ...adding.slice(0, room).map(toPeopleValue)];
    }

    /** 进到一个部门：从搜索结果进去时面包屑只有它（不知道它的上级） */
    function open(department: PeopleEntry) {
      path = searching() ? [department] : [...path, department];
      query = '';
      page = 'org';
      void nextTick(() => list?.focus());
    }

    function onRowClick(entry: PeopleEntry, event: MouseEvent) {
      // 勾选框、按钮自己处理
      if ((event.target as Element).closest('button,input,label,a')) return;
      if (pickable(entry)) toggle(entry);
      else if (drillable(entry)) open(entry);
    }

    /** 行首的圆形标记：人员是头像，部门、岗位是图标 */
    const badge = (entry: PeopleEntry): VNodeChild =>
      entry.type === 'user' ? (
        <Avatar name={entry.name} src={entry.avatar} size="sm" />
      ) : (
        <Avatar
          size="sm"
          fallback={<Icon icon={entry.type === 'department' ? Building : BriefcaseBusiness} />}
        />
      );

    function renderRow(entry: PeopleEntry): VNodeChild {
      const id = peopleKey(entry);
      const checked = selectedKeys.has(id);
      return (
        <ItemListItem
          key={id}
          start={
            <span {...css.attrs(peoplePickerPanelStyles.start)}>
              {pickable(entry) && (
                <Checkbox
                  _checked={checked}
                  onUpdate:_checked={() => toggle(entry)}
                  disabled={!checked && full()}
                  aria-label={entry.name}
                />
              )}
              {badge(entry)}
            </span>
          }
          title={entry.name}
          description={entry.description}
          end={
            drillable(entry) && (
              <Button
                variant="ghost"
                size="sm"
                iconEnd={ChevronRight}
                aria-label={lang.peopleOpen(entry.name)}
                onClick={() => open(entry)}
              >
                {lang.peopleChildren}
              </Button>
            )
          }
          onClick={(event: MouseEvent) => onRowClick(entry, event)}
        />
      );
    }

    function renderBrowse(): VNodeChild {
      const { items, loading } = shown();
      const candidates = items.filter(pickable);
      const checkedCount = candidates.filter((entry) => selectedKeys.has(peopleKey(entry))).length;
      const height = peoplePickerPanelDynamicStyles.height(listHeight);
      return (
        <div {...mergeAttrs<'div'>({ sx: peoplePickerPanelStyles.browse }, propsBrowse)}>
          {source.search && (
            <TextField
              {...mergePartProps<TextFieldProps>(
                {
                  icon: Search,
                  placeholder: lang.peopleSearch,
                  'aria-label': lang.peopleSearch,
                  clearable: true,
                },
                propsSearch,
              )}
              _value={query}
            />
          )}
          {!searching() && pages().length > 1 && (
            <ToggleGroup
              _value={page}
              onUpdate:_value={(next) => next && (page = next as Page)}
              required
              size="sm"
              aria-label={lang.peoplePages}
            >
              {pages().map((item) => (
                <ToggleItem key={item} value={item}>
                  {pageLabel[item]()}
                </ToggleItem>
              ))}
            </ToggleGroup>
          )}
          {!searching() && page === 'org' && (
            <Breadcrumbs
              items={[
                { key: '', label: lang.peopleRoot },
                ...path.map((department) => ({ key: department.id, label: department.name })),
              ]}
              onNavigate={(_, index) => (path = path.slice(0, index))}
            />
          )}
          {max !== 1 && candidates.length > 1 && (
            <Checkbox
              _checked={checkedCount === candidates.length}
              indeterminate={checkedCount > 0 && checkedCount < candidates.length}
              onUpdate:_checked={() => toggleAll(items)}
              size="sm"
            >
              {lang.peopleSelectAll}
            </Checkbox>
          )}
          <div
            {...css.attrs(peoplePickerPanelStyles.list, height)}
            ref={(element: unknown) => (list = element as HTMLElement | null)}
            tabindex={-1}
          >
            {loading ? (
              <div {...css.attrs(peoplePickerPanelStyles.status)}>
                <Spinner label={lang.loading} />
              </div>
            ) : items.length === 0 ? (
              <Small sx={peoplePickerPanelStyles.status}>
                {searching() ? lang.peopleNoResult : lang.peopleEmpty}
              </Small>
            ) : (
              <ItemList
                hoverable
                density="compact"
                aria-label={pageLabel[searching() ? 'org' : page]()}
              >
                {items.map(renderRow)}
              </ItemList>
            )}
          </div>
        </div>
      );
    }

    function renderSelected(): VNodeChild {
      return (
        <div {...mergeAttrs<'div'>({ sx: peoplePickerPanelStyles.selected }, propsSelected)}>
          <div {...css.attrs(peoplePickerPanelStyles.header)}>
            <Strong size="sm">{lang.peopleCount(value.length, max)}</Strong>
            {value.length > 0 && (
              <Button variant="link" size="sm" onClick={() => (value = [])}>
                {lang.clear}
              </Button>
            )}
          </div>
          <div
            {...css.attrs(
              peoplePickerPanelStyles.list,
              peoplePickerPanelDynamicStyles.height(listHeight),
            )}
          >
            {value.length === 0 ? (
              <Small sx={peoplePickerPanelStyles.status}>{lang.peopleNothingSelected}</Small>
            ) : (
              <ItemList density="compact" aria-label={lang.peopleSelected}>
                {value.map((entry) => (
                  <ItemListItem
                    key={peopleKey(entry)}
                    start={badge(entry)}
                    title={entry.name}
                    description={entry.description ?? lang.peopleTypes[entry.type]}
                    end={
                      <IconButton
                        icon={X}
                        variant="ghost"
                        size="sm"
                        aria-label={lang.peopleRemove(entry.name)}
                        onClick={() => toggle(entry)}
                      />
                    }
                  />
                ))}
              </ItemList>
            )}
          </div>
        </div>
      );
    }

    return () => (
      <div {...mergeAttrs<'div'>({ sx: peoplePickerPanelStyles.root }, rest)}>
        <div {...css.attrs(peoplePickerPanelStyles.grid)}>
          {renderBrowse()}
          {renderSelected()}
        </div>
      </div>
    );
  },
);
