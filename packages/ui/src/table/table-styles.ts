/**
 * 表格的外观：静态 Table 与 DataTable、TreeDataTable 共用的选项（密度、样式、斑马纹）与样式表。
 * 单独一个模块：只用静态表格时不连带打包 DataTable 的视图（虚拟滚动、勾选、排序……）。
 */
import * as stylex from '@vue-tsx-pro/tsx/stylex';

/** 表格的密度（行高与字号） */
export interface DataTableDensities {
  /** 紧凑：数据很多、要一屏看更多行（字号也小一档） */
  compact: unknown;
  /** 标准（默认） */
  standard: unknown;
  /** 宽松：行里有头像、两行文字 */
  comfortable: unknown;
}

/** 表格的样式 */
export interface DataTableVariants {
  /** 表面色、外框与圆角（默认） */
  surface: unknown;
  /** 没有外框，底色同页面：放在卡片、对话框里 */
  ghost: unknown;
}

/** 表格的外观选项；可以用 createUi / Provider 的 defaults.DataTable 统一改默认值（TreeDataTable 也用它） */
export interface DataTableOptions {
  /** 密度，默认 standard */
  density?: keyof DataTableDensities;
  /** 样式，默认 surface */
  variant?: keyof DataTableVariants;
  /** 斑马纹：隔行浅色底 */
  striped?: boolean;
}

/** Table、DataTable、TreeDataTable 的样式：root、surface、ghost、table、sm、md 等 */
export const dataTableStyles = stylex.create({
  // contain: inline-size：宽表格不会把外层的 grid / flex 容器撑宽（它们的最小宽度默认等于内容宽度），
  // 宽度只由所在的容器决定，放不下的部分在表格里横向滚动
  // 也是容器查询的容器：详情的内容用 100cqi 限宽到视口，横向滚动时贴着起始边
  root: { maxHeight: '32em', minWidth: 0, containerType: 'inline-size' },
  surface: {
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_border',
    borderRadius: '_lg',
    backgroundColor: '_surface',
  },
  ghost: { backgroundColor: '_background' },
  table: {
    width: '_full',
    tableLayout: 'fixed',
    borderCollapse: 'separate',
    borderSpacing: 0,
    color: '_text',
    lineHeight: '_normal',
  },
  compact: { fontSize: '_sm' },
  standard: {},
  comfortable: {},
  head: { position: 'sticky', top: 0, zIndex: 2 },
  headerCell: {
    position: 'relative',
    boxSizing: 'border-box',
    paddingInline: '_md',
    borderBottomWidth: '_xs',
    borderBottomStyle: 'solid',
    borderBottomColor: '_border',
    backgroundColor: '_fill',
    color: '_textMuted',
    fontSize: '_sm',
    fontWeight: '_semibold',
    textAlign: 'start',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  cell: {
    boxSizing: 'border-box',
    paddingInline: '_md',
    borderBottomWidth: '_xs',
    borderBottomStyle: 'solid',
    borderBottomColor: '_borderMuted',
    backgroundColor: 'inherit',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    verticalAlign: 'middle',
  },
  // 分组标题居中，下边线淡一些：与下面一行的列标题仍是一个表头
  groupHeaderCell: { textAlign: 'center', borderBottomColor: '_borderMuted' },
  // 分组与相邻的列之间一条竖线（只在表头里）：看得出哪几列属于一组
  groupDivider: {
    borderInlineStartWidth: '_xs',
    borderInlineStartStyle: 'solid',
    borderInlineStartColor: '_borderMuted',
  },
  wrap: { whiteSpace: 'normal', overflowWrap: 'anywhere' },
  start: { textAlign: 'start' },
  center: { textAlign: 'center' },
  end: { textAlign: 'end' },
  // 行的底色：固定列的单元格继承它（backgroundColor: inherit），所以必须是不透明的颜色
  row: { backgroundColor: { default: '_surface', ':hover': '_fillHover' } },
  rowGhost: { backgroundColor: { default: '_background', ':hover': '_fillHover' } },
  striped: { backgroundColor: { default: '_fill', ':hover': '_fillHover' } },
  selected: { backgroundColor: { default: '_accentSoft', ':hover': '_accentSoftHover' } },
  // 固定列在普通单元格之上，表头在固定列之上
  sticky: { position: 'sticky', zIndex: 1 },
  // 固定列与滚动的列之间一条竖线：横向滚动时看得出哪几列是固定的
  stickyStartEdge: {
    borderInlineEndWidth: '_xs',
    borderInlineEndStyle: 'solid',
    borderInlineEndColor: '_borderMuted',
  },
  stickyEndEdge: {
    borderInlineStartWidth: '_xs',
    borderInlineStartStyle: 'solid',
    borderInlineStartColor: '_borderMuted',
  },
  // 合计行吸底；在表头、固定列之上
  foot: { position: 'sticky', bottom: 0, zIndex: 2 },
  summaryCell: {
    borderTopWidth: '_xs',
    borderTopStyle: 'solid',
    borderTopColor: '_border',
    borderBottomWidth: 0,
    backgroundColor: '_fill',
    fontWeight: '_semibold',
  },
  // 有起始边的固定列时，勾选列也固定在最前面
  stickySelect: { position: 'sticky', zIndex: 1, insetInlineStart: 0 },
  selectCell: { paddingInline: 0, textAlign: 'center', textOverflow: 'clip' },
  chevronOpen: { rotate: '90deg' },
  // 单元格里 24px 的控件（勾选框、展开按钮、xs 的图标按钮）：上下的负外边距抵掉比一行文字高出的部分，
  // 有控件的行与纯文字的行一样高，点击区域仍是 24px。操作列放文字按钮时用 variant="link"
  cellControl: { marginBlock: '-0.1875rem' },
  detailToggle: { width: '1.5rem', height: '1.5rem', minHeight: '1.5rem' },
  // 详情行：浅底、可以换行；内边距放在内容上，内容贴着视口起始边、宽度不超过视口
  detailCell: { paddingBlock: 0, paddingInline: 0, whiteSpace: 'normal', backgroundColor: '_fill' },
  detailContent: {
    position: 'sticky',
    insetInlineStart: 0,
    boxSizing: 'border-box',
    maxWidth: '100cqi',
    paddingBlock: '_md',
    paddingInline: '_md',
  },
  // 去掉按钮默认外观、焦点环、波纹、颜色过渡由 ButtonBase 给出
  sortButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '_xs',
    maxWidth: '_full',
    color: { default: 'inherit', ':hover': '_text' },
  },
  sortLabel: { overflow: 'hidden', textOverflow: 'ellipsis' },
  sortIcon: { flexShrink: 0 },
  sortActive: { color: '_accentText' },
  leading: { display: 'flex', alignItems: 'center', gap: '_xs', minWidth: 0 },
  content: { minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' },
  spacer: { padding: 0, borderWidth: 0 },
  progressCell: { position: 'relative', height: 0, padding: 0, borderWidth: 0 },
  progress: { position: 'absolute', top: 0, insetInline: 0 },
  skeleton: { display: 'block', height: '1em' },
  emptyCell: { padding: 0, whiteSpace: 'normal' },
});

/** Table、DataTable、TreeDataTable 的样式：单元格按密度的上下内边距 */
export const dataTableDensityStyles = stylex.create({
  compact: { paddingBlock: '_xs' },
  standard: { paddingBlock: '_sm' },
  comfortable: { paddingBlock: '_md' },
});
