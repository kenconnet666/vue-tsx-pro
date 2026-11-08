/**
 * 表格的外观：静态 Table 与 DataTable、TreeDataTable 共用的选项（密度、样式、斑马纹）与按列、按状态叠加的样式，
 * 以及 DataTable、TreeDataTable 的配方（静态表格的配方在 Table.tsx）。
 * 单独一个模块：只用静态表格时不连带打包 DataTable 的视图（虚拟滚动、勾选、排序……）。
 */
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { t } from '../config/theme/tokens';

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

/**
 * 静态 Table 与 DataTable 共用的部件样式：表格、列标题、单元格。两个配方直接引用，两种表格的样子只写在一处；
 * 表格的布局（auto / fixed）、外层、斑马纹各自的配方里给
 * @internal 组件之间共用，不进入口
 */
export const tablePartStyles = css.create({
  table: {
    width: '_full',
    borderCollapse: 'separate',
    borderSpacing: 0,
    color: '_text',
    lineHeight: '_normal',
  },
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
    fontWeight: '_medium',
    textAlign: 'start',
    whiteSpace: 'nowrap',
    // 只为省略号横向裁掉；clip 不像 hidden 会把纵向变成 auto，紧凑行里按钮的焦点环上下不被裁
    overflowX: 'clip',
    textOverflow: 'ellipsis',
  },
  // 数字等宽：金额、数量、日期上下对齐（文字不受影响）
  cell: {
    boxSizing: 'border-box',
    fontVariantNumeric: 'tabular-nums',
    paddingInline: '_md',
    borderBottomWidth: '_xs',
    borderBottomStyle: 'solid',
    borderBottomColor: '_borderMuted',
    backgroundColor: 'inherit',
    // 同表头格：只横向裁掉
    overflowX: 'clip',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    verticalAlign: 'middle',
  },
});

const densityStyles = css.create({
  compactTable: { fontSize: '_sm' },
  compact: { paddingBlock: '_xs' },
  standard: { paddingBlock: '_sm' },
  comfortable: { paddingBlock: '_md' },
});

/**
 * 密度档位（两个配方共用）：单元格的上下内边距；紧凑时字号也小一档
 * @internal
 */
export const tableDensityVariant = {
  compact: {
    table: [densityStyles.compactTable],
    headerCell: [densityStyles.compact],
    cell: [densityStyles.compact],
  },
  standard: { headerCell: [densityStyles.standard], cell: [densityStyles.standard] },
  comfortable: { headerCell: [densityStyles.comfortable], cell: [densityStyles.comfortable] },
} as const;

const variantStyles = css.create({
  surfaceRoot: {
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_border',
    borderRadius: '_lg',
    backgroundColor: '_surface',
  },
  surfaceRow: { backgroundColor: { default: '_surface', _hover: '_fillHover' } },
  ghostRoot: { backgroundColor: '_background' },
  ghostRow: { backgroundColor: { default: '_background', _hover: '_fillHover' } },
});

/**
 * 样式档位（两个配方共用）。行的底色：固定列的单元格继承它（backgroundColor: inherit），所以必须是不透明的颜色
 * @internal
 */
export const tableVariantVariant = {
  surface: { root: [variantStyles.surfaceRoot], row: [variantStyles.surfaceRow] },
  ghost: { root: [variantStyles.ghostRoot], row: [variantStyles.ghostRow] },
} as const;

/**
 * 单元格里的勾选框、单选框（加在外层 label 上，撑出 24px 点击区域的是它，不是里面的 input）：
 * 叠放层在 label 的顶上、高一行（1.5em），多出的点击区域在下面。顶部对齐、下边的负外边距抵掉多出的部分，
 * label 正好占一行文字，勾选框在这一行的正中，有勾选列的行与纯文字的行一样高（按基线或居中对齐都会因字体差出零点几像素）
 */
const choiceInCell = {
  verticalAlign: 'top',
  marginBlockEnd: `min(0px, 1.5em - ${t.sizes.minTarget})`,
} as const;

/**
 * DataTable、TreeDataTable 的配方：部件对应渲染出来的元素，密度、样式、斑马纹是档位。
 * 同类的格叠在一起用：勾选列、合计行、详情、空状态的格是 `[s.cell.sx, s.selectCell.sx]`，
 * 分组标题、表头的勾选列是 `[s.headerCell.sx, s.groupHeaderCell.sx]`；对齐、固定列、已选这些按列、按状态的
 * 样式（dataTableStateStyles）追加在部件层之后。
 * 斑马纹按行号隔行（虚拟滚动里 :nth-child 数不准）：`striped: true` 选的是浅色底的那些行
 */
export const dataTableRecipe = css.recipe({
  name: 'DataTable',
  parts: [
    'root',
    'table',
    'head',
    'headRow',
    'headerCell',
    'groupHeaderCell',
    'selectHeaderCell',
    'detailHeaderCell',
    'headerContent',
    'headerMain',
    'sortButton',
    'sortLabel',
    'sortIcon',
    'sortPriority',
    'selectAll',
    'body',
    'row',
    'cell',
    'selectCell',
    'selectCheckbox',
    'selectRadio',
    'detailToggleCell',
    'detailToggle',
    'leading',
    'content',
    'rowHandle',
    'editor',
    'editorControl',
    'editorError',
    'detailRow',
    'detailCell',
    'detailContent',
    'skeleton',
    'emptyCell',
    'spacer',
    'foot',
    'summaryCell',
  ],
  base: {
    // contain: inline-size：宽表格不会把外层的 grid / flex 容器撑宽（它们的最小宽度默认等于内容宽度），
    // 宽度只由所在的容器决定，放不下的部分在表格里横向滚动
    // 也是容器查询的容器：详情的内容用 100cqi 限宽到视口，横向滚动时贴着起始边
    root: { maxHeight: '32em', minWidth: 0, containerType: 'inline-size' },
    table: [tablePartStyles.table, { tableLayout: 'fixed' }],
    head: { position: 'sticky', top: 0, zIndex: 2 },
    headerCell: [tablePartStyles.headerCell],
    // 分组标题居中，下边线淡一些：与下面一行的列标题仍是一个表头
    groupHeaderCell: { textAlign: 'center', borderBottomColor: '_borderMuted' },
    // 勾选列、详情列的格（表头与各行）：控件居中，没有左右内边距
    selectHeaderCell: { paddingInline: 0, textAlign: 'center', textOverflow: 'clip' },
    detailHeaderCell: { paddingInline: 0, textAlign: 'center', textOverflow: 'clip' },
    // 有筛选、列菜单按钮的列标题：文字（或排序按钮）占满剩下的宽度，按钮在结尾
    headerContent: { display: 'flex', alignItems: 'center', gap: '_xs', minWidth: 0 },
    headerMain: { flexGrow: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' },
    // 去掉按钮默认外观、焦点环、波纹、颜色过渡由 ButtonBase 给出
    // 焦点环画在里面：外层 headerMain 为省略号裁掉了溢出，画在外面会被整圈裁掉（同 focusRingStyles.inset）
    sortButton: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '_xs',
      maxWidth: '_full',
      color: { default: 'inherit', _hover: '_text' },
      outlineOffset: `calc(-1 * ${t.borderWidths.sm})`,
    },
    sortLabel: { overflow: 'hidden', textOverflow: 'ellipsis' },
    sortIcon: { flexShrink: 0 },
    // 多列排序时的次序（1、2…）：小号数字跟在箭头后面
    sortPriority: { fontSize: '0.75em', fontVariantNumeric: 'tabular-nums', color: '_accentText' },
    // 单元格里 24px 的控件不把行撑高，点击区域仍是 24px：勾选框、单选框见 choiceInCell；
    // 展开按钮上下的负外边距抵掉比一行文字高出的部分。操作列放文字按钮时用 variant="link"
    selectAll: choiceInCell,
    cell: [tablePartStyles.cell],
    selectCell: { paddingInline: 0, textAlign: 'center', textOverflow: 'clip' },
    selectCheckbox: choiceInCell,
    selectRadio: choiceInCell,
    detailToggleCell: { paddingInline: 0, textAlign: 'center', textOverflow: 'clip' },
    detailToggle: {
      width: '_minTarget',
      height: '_minTarget',
      minHeight: '_minTarget',
      marginBlock: '-0.1875rem',
    },
    leading: { display: 'flex', alignItems: 'center', gap: '_xs', minWidth: 0 },
    content: { minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' },
    // 行拖动的把手：在第一个数据列的最前面，按下拖动，或聚焦后用键盘
    rowHandle: {
      display: 'grid',
      placeItems: 'center',
      flexShrink: 0,
      width: '1.5em',
      height: '1.5em',
      marginBlock: '-0.25em',
      borderRadius: '_sm',
      backgroundColor: { default: 'transparent', _hover: '_fillHover' },
      color: '_textMuted',
      cursor: { default: 'grab', _active: 'grabbing' },
      // 触摸拖动时不滚动页面
      touchAction: 'none',
    },
    // 编辑器：贴着格子；提交被拒的原因浮在下面（不撑高这一行）
    editor: { position: 'relative', minWidth: 0 },
    editorControl: { width: '_full' },
    editorError: {
      position: 'absolute',
      insetInlineStart: 0,
      top: 'calc(100% + 2px)',
      zIndex: 3,
      // 按文字宽度，不被窄列挤成一字一行；靠起始边（数字列的格是靠结束边的）
      width: 'max-content',
      maxWidth: '20rem',
      textAlign: 'start',
      paddingBlock: '_xs',
      paddingInline: '_sm',
      borderRadius: '_sm',
      backgroundColor: '_danger',
      color: '_dangerContrast',
      fontSize: '_sm',
      whiteSpace: 'normal',
      boxShadow: '_md',
    },
    // 详情行：浅底、可以换行；内边距放在内容上，内容贴着视口起始边、宽度不超过视口
    detailCell: {
      paddingBlock: 0,
      paddingInline: 0,
      whiteSpace: 'normal',
      backgroundColor: '_fill',
    },
    detailContent: {
      position: 'sticky',
      insetInlineStart: 0,
      boxSizing: 'border-box',
      maxWidth: '100cqi',
      paddingBlock: '_md',
      paddingInline: '_md',
    },
    skeleton: { display: 'block', height: '1em' },
    // paddingBlock 盖过单元格按密度的上下内边距（padding 是简写，压不过它）
    emptyCell: { paddingBlock: 0, padding: 0, whiteSpace: 'normal' },
    spacer: { padding: 0, borderWidth: 0 },
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
  },
  variants: {
    density: tableDensityVariant,
    variant: tableVariantVariant,
    striped: {
      true: { row: { backgroundColor: { default: '_fill', _hover: '_fillHover' } } },
    },
  },
});

/** DataTable、TreeDataTable 的部件（createUi / Provider 的 styles.DataTable 按它定制） */
export type DataTablePart = (typeof dataTableRecipe.parts)[number];

/**
 * 表格按列、按状态叠加的样式：对齐、换行、固定列、已选、正在看、编辑中……追加在部件层之后
 * （`{ ...s.cell, sx: [s.cell.sx, dataTableStateStyles.end] }`）。静态 Table 的对齐、换行也用它
 * @internal 组件之间共用，不进入口
 */
export const dataTableStateStyles = css.create({
  // 放在竖排的弹性容器（ViewportFill）里：按行数自己的高度，最多占到剩下的高度，再多在表格里滚动
  flexible: { flexGrow: 0, flexShrink: 1, flexBasis: 'auto', maxHeight: 'none', minHeight: 0 },
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
  // 已选（aria-selected）与主从视图里正在看的一行（aria-current）跟着属性走：品牌色浅底，悬停深一档，压过行的色调
  rowStates: {
    backgroundColor: {
      default: null,
      _selected: { default: '_accentSoft', _hover: '_accentSoftHover' },
      _current: { default: '_accentSoft', _hover: '_accentSoftHover' },
    },
  },
  // 正在看的一行起始边一条强调色的竖线（与勾选区分开）画在第一个单元格上：浏览器不给 tr 画阴影
  activeEdge: {
    boxShadow: {
      default: `inset 3px 0 0 ${t.colors.accent}`,
      _rtl: `inset -3px 0 0 ${t.colors.accent}`,
    },
  },
  // 整行能点（打开详情）：手形指针
  clickable: { cursor: 'pointer' },
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
  // 固定在起始边、偏移 0：有起始边的固定列时的勾选列，静态表格固定的第一列
  stickyStart: { position: 'sticky', zIndex: 1, insetInlineStart: 0 },
  sortActive: { color: '_accentText' },
  // 靠结束边的列（数字）：文字靠结束边，按钮仍在最后
  headerMainEnd: { textAlign: 'end' },
  // 单元格导航：聚焦的格画一圈内描边（不占位、不被相邻格盖住）
  gridCell: {
    outline: 'none',
    boxShadow: {
      default: null,
      _focusVisible: `inset 0 0 0 ${t.borderWidths.sm} ${t.colors.focusRing}`,
    },
  },
  // 单击就能编辑的格
  clickToEdit: { cursor: 'text' },
  // 编辑中的格：编辑器贴满格子，上下内边距收小
  editingCell: { paddingBlock: '_none', overflowX: 'visible' },
  // 校验没过的格：红色内描边；聚焦时仍是焦点环
  invalidCell: {
    boxShadow: {
      default: `inset 0 0 0 ${t.borderWidths.xs} ${t.colors.danger}`,
      _focusVisible: `inset 0 0 0 ${t.borderWidths.sm} ${t.colors.focusRing}`,
    },
  },
  // 正在拖动的行：浮在别的行上面
  rowDragging: { position: 'relative', zIndex: 1, boxShadow: '_md' },
});
