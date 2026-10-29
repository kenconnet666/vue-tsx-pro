/**
 * 宫格：一排几个的入口（首页的功能区、个人中心的订单状态），每格一个图标加文字，可带徽标。
 *
 *   <Grid columns={4}>
 *     <GridItem icon={Wallet} text="待付款" badge={2} onClick={…} />
 *     <GridItem icon={Truck} text="待收货" />
 *   </Grid>
 *   <Grid columns={3} square border={false}>…</Grid>
 */
import { _component, createContext } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { Icon, type IconData, type IconProps } from '../base/Icon';
import { dataAttrs, hasContent, mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { Badge } from './Badge';

/** 宫格提供给各格的 */
interface GridState {
  readonly columns: number;
  readonly square: boolean;
  readonly border: boolean;
}

const GridContext = createContext<GridState>('Grid');

/** 未声明的属性落到根元素（div）上 */
export interface GridProps extends PartProps<'div'> {
  /**
   * 一排几个
   * @default 4
   */
  columns?: number;
  /** 每格是正方形 */
  square?: boolean;
  /**
   * 格子之间画细线
   * @default true
   */
  border?: boolean;
  /** 各个 GridItem */
  children?: VNodeChild;
}

/** Grid、GridItem 的样式：root、bordered、item、itemBorder、square、clickable、icon、text */
export const gridStyles = css.create({
  root: { display: 'flex', flexWrap: 'wrap', backgroundColor: '_surface' },
  bordered: {
    borderBlockStartWidth: '_hairline',
    borderBlockStartStyle: 'solid',
    borderBlockStartColor: '_border',
  },
  item: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.45em',
    paddingBlock: '1em',
    paddingInline: '0.5em',
    fontSize: '_xs',
    color: '_text',
    textAlign: 'center',
  },
  itemBorder: {
    borderInlineEndWidth: '_hairline',
    borderInlineEndStyle: 'solid',
    borderInlineEndColor: '_border',
    borderBlockEndWidth: '_hairline',
    borderBlockEndStyle: 'solid',
    borderBlockEndColor: '_border',
  },
  square: { aspectRatio: '1' },
  clickable: {
    cursor: 'pointer',
    userSelect: 'none',
    backgroundColor: { default: '_surface', ':active': '_fillActive' },
  },
  icon: { fontSize: '1.75em', color: '_text' },
  text: { overflowWrap: 'anywhere' },
});

/** 宫格（div > 各格） */
export const Grid = _component(
  ({ columns = 4, square = false, border = true, children, ...rest }: GridProps) => {
    GridContext.provide({
      get columns() {
        return columns;
      },
      get square() {
        return square;
      },
      get border() {
        return border;
      },
    });
    return () => (
      <div
        {...mergeAttrs<'div'>({ sx: [gridStyles.root, border && gridStyles.bordered] }, rest, {
          role: 'list',
        })}
      >
        {children}
      </div>
    );
  },
);

/** 未声明的属性落到格子（div）上 */
export interface GridItemProps extends PartProps<'div', 'role'> {
  /** 图标 */
  icon?: IconData;
  /** 文字 */
  text?: VNodeChild;
  /** 图标右上角的徽标：数字、文字，true 是小红点 */
  badge?: number | string | boolean;
  /** 自定义内容（代替图标与文字） */
  children?: VNodeChild;
  /** 图标的部件属性 */
  propsIcon?: Partial<IconProps>;
}

/** 宫格的一格（div[role=listitem]）：有 onClick 时可点击 */
export const GridItem = _component(
  ({ icon, text, badge, children, propsIcon, ...rest }: GridItemProps) => {
    const grid = GridContext.inject();
    return () => {
      const clickable = rest.onClick !== undefined;
      const glyph = icon && (
        <Icon {...mergePartProps<IconProps>({ icon, sx: gridStyles.icon }, propsIcon)} />
      );
      return (
        <div
          {...mergeAttrs<'div'>(
            {
              sx: [
                gridStyles.item,
                grid.border && gridStyles.itemBorder,
                grid.square && gridStyles.square,
                clickable && gridStyles.clickable,
              ],
              style: { flexBasis: `${100 / grid.columns}%`, maxWidth: `${100 / grid.columns}%` },
            },
            rest,
            { role: 'listitem', ...dataAttrs({ 'data-clickable': clickable }) },
          )}
        >
          {hasContent(children)
            ? children
            : [
                glyph &&
                  (badge === undefined || badge === false ? (
                    glyph
                  ) : (
                    <Badge content={badge === true ? undefined : badge} dot={badge === true}>
                      {glyph}
                    </Badge>
                  )),
                hasContent(text) && (
                  <span {...mergeAttrs<'span'>({ sx: gridStyles.text })}>{text}</span>
                ),
              ]}
        </div>
      );
    };
  },
);
