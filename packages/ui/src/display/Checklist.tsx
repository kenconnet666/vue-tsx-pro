/**
 * 完成清单：每一项完成了没有（勾、虚线圈），带补充信息（日期、证据、超时）。里程碑、关闭材料、上线检查、引导任务。
 *
 *   <Checklist items={[{ label: '方案确定', done: true, extra: '2026-09-12' }, { label: '验证完成', done: false }]} />
 *   <Checklist layout="inline" items={…} />                 一行排开、放不下换行（详情行、卡片的一角）
 *   <Checklist layout="icons" aria-label="里程碑" items={…} />   只有一排图标（表格的格子里）；读屏念每一项完成没有
 *
 * list（默认）一项一行、名称占满、补充信息靠结束边（建在 ItemList 上）；没完成的名称是次要色。
 */
import { CircleCheck, CircleDashed } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { Icon } from '../base/Icon';
import { Text } from '../base/Text';
import { useLang } from '../config/context';
import { mergeAttrs, type PartProps } from '../utils/props';
import type { TextSize } from '../utils/style/typography';
import { ItemList, ItemListItem } from './ItemList';

/** 清单的一项 */
export interface ChecklistItem {
  /** 唯一的 key；不写时用 label（label 是文字时） */
  key?: string;
  /** 名称 */
  label: VNodeChild;
  /** 完成了没有 */
  done: boolean;
  /** 补充信息：日期、证据、超时 */
  extra?: VNodeChild;
}

/** 清单的排法 */
export interface ChecklistLayouts {
  /** 一项一行（默认）：名称占满、补充信息靠结束边 */
  list: unknown;
  /** 一行排开、放不下换行 */
  inline: unknown;
  /** 只有一排图标：表格的格子里；悬停与读屏有每一项的说明 */
  icons: unknown;
}

/** 未声明的属性落到外层元素上（list、inline 是 ul，icons 是 span） */
export interface ChecklistProps extends PartProps<'div'> {
  /** 各项 */
  items: readonly ChecklistItem[];
  /**
   * 排法
   * @default 'list'
   */
  layout?: keyof ChecklistLayouts;
  /**
   * 名称的字号
   * @default 'sm'
   */
  size?: TextSize;
}

/** Checklist 的样式：done、todo、inline、inlineItem、icons */
export const checklistStyles = stylex.create({
  done: { color: '_successText', flexShrink: 0 },
  todo: { color: '_textMuted', flexShrink: 0 },
  inline: {
    display: 'flex',
    flexWrap: 'wrap',
    columnGap: '_lg',
    rowGap: '_xs',
    margin: 0,
    padding: 0,
    listStyle: 'none',
  },
  inlineItem: { display: 'inline-flex', alignItems: 'center', gap: '_xs', whiteSpace: 'nowrap' },
  icons: { display: 'inline-flex', alignItems: 'center', gap: '2px' },
});

const keyOf = (item: ChecklistItem, index: number) =>
  item.key ?? (typeof item.label === 'string' ? item.label : String(index));

/** 完成清单 */
export const Checklist = _component(
  ({ items, layout = 'list', size = 'sm', ...rest }: ChecklistProps) => {
    const lang = useLang();
    const stateIcon = (done: boolean) => (
      <Icon
        icon={done ? CircleCheck : CircleDashed}
        sx={done ? checklistStyles.done : checklistStyles.todo}
      />
    );
    return () => {
      if (layout === 'icons') {
        const label = items
          .map((item) =>
            lang.checklistItemState(typeof item.label === 'string' ? item.label : '', item.done),
          )
          .join('，');
        return (
          <span
            {...mergeAttrs<'span'>({ sx: checklistStyles.icons }, rest as PartProps<'span'>, {
              role: 'img',
              'aria-label': label,
              title: label,
            })}
          >
            {items.map((item, index) => (
              <span key={keyOf(item, index)}>{stateIcon(item.done)}</span>
            ))}
          </span>
        );
      }
      if (layout === 'inline')
        return (
          <ul {...mergeAttrs<'ul'>({ sx: checklistStyles.inline }, rest as PartProps<'ul'>)}>
            {items.map((item, index) => (
              <li key={keyOf(item, index)} {...stylex.attrs(checklistStyles.inlineItem)}>
                {stateIcon(item.done)}
                <Text size={size} tone={item.done ? undefined : 'muted'}>
                  {item.label}
                </Text>
                {item.extra}
              </li>
            ))}
          </ul>
        );
      return (
        <ItemList {...(rest as PartProps<'ul'>)} density="compact">
          {items.map((item, index) => (
            <ItemListItem
              key={keyOf(item, index)}
              start={stateIcon(item.done)}
              title={
                <Text size={size} tone={item.done ? undefined : 'muted'}>
                  {item.label}
                </Text>
              }
              end={item.extra}
            />
          ))}
        </ItemList>
      );
    };
  },
);
