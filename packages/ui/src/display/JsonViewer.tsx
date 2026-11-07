/**
 * JSON 查看器：接口返回、日志、配置、导入的原始数据，展开收起的键值树。建在 Tree 上：虚拟滚动（上万个节点也流畅）、
 * 树的键盘操作（↑↓ 移动、→ 展开、← 收起、按字母跳）与搜索过滤（留下匹配的项与祖先，匹配的加粗）。
 *
 *   <JsonViewer value={response} />
 *   <JsonViewer value={config} expandDepth={2} maxHeight="32rem" aria-label="配置" />
 *
 * - 值按类型着色（代码高亮的 token）：字符串带引号；数字、bigint、Decimal 这类自带 toString 的对象照实显示（不丢精度）；
 *   Date 显示 ISO；null、undefined、布尔是关键字色。对象、数组、Map、Set 可以展开，收起时显示项数；循环引用显示 [Circular]。
 * - 选中一项（点击、Enter）后，下方的路径栏显示它的路径（JavaScript 写法：$.items[0]["unit-price"]）与值，可以复制；
 *   对象、数组复制成缩进两格的 JSON（bigint、Decimal 写成数字原样的文字）。
 * - 子节点按需生成：展开到哪一层才建哪一层；toolbar 的“全部展开”会建全部。
 *
 * 部件：Root（div）、Toolbar（搜索框与按钮）、Tree、PathBar（路径栏）。
 */
import { ChevronsDownUp, ChevronsUpDown, Search } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { watch } from 'vue';
import { Button, type ButtonProps } from '../base/Button';
import { CopyButton } from '../base/CopyButton';
import { useLang } from '../config/context';
import { TextField, type TextFieldProps } from '../input/TextField';
import { Tooltip } from '../overlay/Tooltip';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { Tree, type TreeProps } from './Tree';
import { partAttrs } from '../config/styles';

/** 一项的类型：决定颜色与能不能展开（other 是自带 toString 的对象，circular 是循环引用） */
export type JsonViewerKind =
  | 'object'
  | 'array'
  | 'map'
  | 'set'
  | 'string'
  | 'number'
  | 'boolean'
  | 'null'
  | 'undefined'
  | 'date'
  | 'other'
  | 'function'
  | 'circular';

/** 树上的一项（propsTree 的 renderItem 这类函数拿到它） */
export interface JsonViewerNode {
  /** 路径，也是 Tree 的 key */
  path: string;
  /** 键名或序号 */
  name: string;
  /** 这一项的值 */
  value: unknown;
  /** 值的类型 */
  kind: JsonViewerKind;
  /** 从根到这里经过的对象：认出循环引用 */
  ancestors: readonly object[];
}

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;
const CONTAINERS = new Set<JsonViewerKind>(['object', 'array', 'map', 'set']);

function kindOf(value: unknown): JsonViewerKind {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (value instanceof Date) return 'date';
  if (value instanceof Map) return 'map';
  if (value instanceof Set) return 'set';
  switch (typeof value) {
    case 'string':
      return 'string';
    case 'number':
    case 'bigint':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'undefined':
      return 'undefined';
    case 'function':
      return 'function';
    case 'object': {
      // Decimal、Big 这类数字对象照实显示成数字
      if (typeof (value as { toFixed?: unknown }).toFixed === 'function') return 'number';
      // 普通对象展开；自带 toString 的（CalendarDate、URL）当成一个值照实显示
      const proto = Object.getPrototypeOf(value) as object | null;
      return proto === null ||
        proto === Object.prototype ||
        value.toString === Object.prototype.toString
        ? 'object'
        : 'other';
    }
    default:
      return 'other';
  }
}

function nodeOf(
  path: string,
  name: string,
  value: unknown,
  ancestors: readonly object[],
): JsonViewerNode {
  const kind =
    typeof value === 'object' && value !== null && ancestors.includes(value)
      ? 'circular'
      : kindOf(value);
  return { path, name, value, kind, ancestors };
}

/** 对象的键接在路径后面：标识符用点，别的写成 ["…"] */
const memberPath = (parent: string, key: string) =>
  IDENTIFIER.test(key) ? `${parent}.${key}` : `${parent}[${JSON.stringify(key)}]`;

/** 子节点（按需建、每个节点只建一次） */
const childrenCache = new WeakMap<JsonViewerNode, JsonViewerNode[]>();
function childrenOf(node: JsonViewerNode): JsonViewerNode[] | undefined {
  if (!CONTAINERS.has(node.kind)) return undefined;
  const cached = childrenCache.get(node);
  if (cached) return cached;
  const value = node.value as object;
  const ancestors = [...node.ancestors, value];
  let children: JsonViewerNode[];
  if (node.kind === 'array') {
    children = (value as unknown[]).map((item, index) =>
      nodeOf(`${node.path}[${index}]`, String(index), item, ancestors),
    );
  } else if (node.kind === 'set') {
    children = [...(value as Set<unknown>)].map((item, index) =>
      nodeOf(`[...${node.path}][${index}]`, String(index), item, ancestors),
    );
  } else if (node.kind === 'map') {
    children = [...(value as Map<unknown, unknown>)].map(([key, item]) =>
      nodeOf(
        `${node.path}.get(${JSON.stringify(key) ?? String(key)})`,
        String(key),
        item,
        ancestors,
      ),
    );
  } else {
    children = Object.entries(value).map(([key, item]) =>
      nodeOf(memberPath(node.path, key), key, item, ancestors),
    );
  }
  childrenCache.set(node, children);
  return children;
}

/** 收起时的项数 */
function sizeOf(node: JsonViewerNode): number {
  const value = node.value as object;
  if (node.kind === 'array') return (value as unknown[]).length;
  if (node.kind === 'map' || node.kind === 'set') return (value as Map<unknown, unknown>).size;
  return Object.keys(value).length;
}

/** 一行里值的写法 */
function display(node: JsonViewerNode): string {
  const { value, kind } = node;
  switch (kind) {
    case 'object':
      return '{…}';
    case 'array':
      return '[…]';
    case 'map':
      return 'Map {…}';
    case 'set':
      return 'Set […]';
    case 'string':
      return JSON.stringify(value);
    case 'date':
      return Number.isNaN((value as Date).getTime())
        ? 'Invalid Date'
        : (value as Date).toISOString();
    case 'function':
      return `ƒ ${(value as { name?: string }).name || 'anonymous'}()`;
    case 'circular':
      return '[Circular]';
    default:
      return String(value);
  }
}

/** 复制的值：字符串原样，容器写成缩进两格的 JSON（bigint、Decimal 照实写成文字，Map、Set 写成对象、数组） */
function copyText(node: JsonViewerNode): string {
  if (node.kind === 'string') return node.value as string;
  if (!CONTAINERS.has(node.kind)) return display(node);
  return JSON.stringify(
    node.value,
    (_, value: unknown) => {
      if (typeof value === 'bigint') return value.toString();
      if (value instanceof Map) return Object.fromEntries(value);
      if (value instanceof Set) return [...value];
      return value;
    },
    2,
  );
}

/** 未声明的属性落到根元素（div）上；aria-label 是树的名称 */
export interface JsonViewerProps extends PartProps<'div'> {
  /** 要看的数据：JSON.parse 的结果或任意 JavaScript 值 */
  value: unknown;
  /** 一开始展开几层，默认 1（第一层的对象、数组是展开的）；0 全部收起 */
  expandDepth?: number;
  /** 树的最大高度，超出后滚动，默认 24rem */
  maxHeight?: string;
  /** 顶部的搜索框与“全部展开 / 收起”，默认显示 */
  toolbar?: boolean;
  /** 搜索框的部件属性 */
  propsSearch?: Partial<TextFieldProps>;
  /** 树的部件属性 */
  propsTree?: Partial<TreeProps<JsonViewerNode>>;
  /** 路径栏的部件属性 */
  propsPathBar?: PartProps<'div'>;
  /** “全部展开”按钮的部件属性 */
  propsExpandAll?: Partial<ButtonProps>;
  /** “全部收起”按钮的部件属性 */
  propsCollapseAll?: Partial<ButtonProps>;
}

/** 部件的标记（data-scope="json-viewer"） */
const jsonViewerPart = (part: string) => partAttrs({ name: 'JsonViewer' }, part);

/** JsonViewer 的样式：root、toolbar、search、tree、row、name、index、value、kinds、summary、pathBar、path */
export const jsonViewerStyles = css.create({
  root: { display: 'flex', flexDirection: 'column', gap: '_xs', minWidth: 0 },
  toolbar: { display: 'flex', alignItems: 'center', gap: '_xs', flexWrap: 'wrap' },
  search: { flex: '1 1 12em', minWidth: 0 },
  // 等宽字体的连字会把 >= 画成 ≥：看原始数据时关掉
  tree: { fontFamily: '_mono', fontSize: '_sm', fontVariantLigatures: 'none' },
  row: { display: 'flex', alignItems: 'baseline', gap: '0.5ch', minWidth: 0, whiteSpace: 'nowrap' },
  name: { color: '_codeAttribute', flexShrink: 0 },
  index: { color: '_codeComment', flexShrink: 0 },
  value: { overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 },
  string: { color: '_codeString' },
  number: { color: '_codeNumber' },
  keyword: { color: '_codeKeyword' },
  type: { color: '_codeType' },
  muted: { color: '_codeComment' },
  summary: { color: '_codeComment', flexShrink: 0 },
  pathBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '_xs',
    minHeight: '2.25em',
    paddingInline: '_xs',
    fontSize: '_sm',
    color: '_textMuted',
  },
  path: {
    fontFamily: '_mono',
    color: '_text',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
  },
});

const KIND_STYLES: Partial<Record<JsonViewerKind, keyof typeof jsonViewerStyles>> = {
  string: 'string',
  number: 'number',
  boolean: 'keyword',
  null: 'keyword',
  undefined: 'keyword',
  date: 'type',
  other: 'type',
  function: 'type',
  object: 'muted',
  array: 'muted',
  map: 'muted',
  set: 'muted',
  circular: 'muted',
};

/** 动态样式（任意值，单独一个 create，见 COMPONENTS.md §4） */
const jsonViewerSizeStyles = css.create({ maxHeight: (value: string) => ({ maxHeight: value }) });

/** JSON 查看器：可展开收起、按类型着色、可搜索、可复制值与路径 */
export const JsonViewer = _component(
  ({
    value,
    expandDepth = 1,
    maxHeight = '24rem',
    toolbar = true,
    propsSearch,
    propsTree,
    propsPathBar,
    propsExpandAll,
    propsCollapseAll,
    'aria-label': label,
    ...rest
  }: JsonViewerProps) => {
    const lang = useLang();
    let query = _state('');
    let expanded = _state<string[]>([]);
    let selected = _state<string[]>([]);

    /** 第一层：根是容器时是它的各项，不然是根本身 */
    const roots = _derived.by((): JsonViewerNode[] => {
      const root = nodeOf('$', '$', value, []);
      return childrenOf(root) ?? [root];
    });
    // 见过的节点按路径记下：路径栏按选中的路径找回节点（随 value 换掉）
    let byPath = new Map<string, JsonViewerNode>();

    /** 展开到第 depth 层的容器（depth 为 Infinity 时全部展开） */
    const containersTo = (depth: number) => {
      const keys: string[] = [];
      const visit = (nodes: readonly JsonViewerNode[], level: number) => {
        for (const node of nodes) {
          byPath.set(node.path, node);
          if (level >= depth || !CONTAINERS.has(node.kind)) continue;
          keys.push(node.path);
          visit(childrenOf(node)!, level + 1);
        }
      };
      visit(roots, 0);
      return keys;
    };
    watch(
      () => [roots, expandDepth] as const,
      () => {
        byPath = new Map();
        expanded = containersTo(expandDepth);
        selected = [];
      },
      { immediate: true },
    );

    const current = () => {
      const path = selected[0];
      return path === undefined ? undefined : byPath.get(path);
    };

    const renderItem = (node: JsonViewerNode) => {
      byPath.set(node.path, node);
      const container = CONTAINERS.has(node.kind);
      const kindStyle = KIND_STYLES[node.kind];
      return (
        <span {...css.attrs(jsonViewerStyles.row)} {...jsonViewerPart('row')}>
          <span
            {...css.attrs(/^\d+$/.test(node.name) ? jsonViewerStyles.index : jsonViewerStyles.name)}
          >
            {node.name}:
          </span>
          <span
            {...css.attrs(jsonViewerStyles.value, kindStyle && jsonViewerStyles[kindStyle])}
            {...jsonViewerPart('value')}
          >
            {display(node)}
          </span>
          {container && (
            <span {...css.attrs(jsonViewerStyles.summary)} {...jsonViewerPart('summary')}>
              {lang.jsonItems(sizeOf(node))}
            </span>
          )}
        </span>
      );
    };

    return () => {
      const node = current();
      return (
        <div {...mergeAttrs<'div'>({ sx: jsonViewerStyles.root, ...jsonViewerPart('root') }, rest)}>
          {toolbar && (
            <div {...css.attrs(jsonViewerStyles.toolbar)} {...jsonViewerPart('toolbar')}>
              <TextField
                {...mergePartProps<TextFieldProps>(
                  {
                    icon: Search,
                    size: 'sm',
                    type: 'search',
                    placeholder: lang.jsonSearch,
                    'aria-label': lang.jsonSearch,
                    propsRoot: { sx: jsonViewerStyles.search },
                  },
                  propsSearch,
                )}
                _value={query}
              />
              <Button
                {...mergePartProps<ButtonProps>(
                  { size: 'sm', variant: 'ghost', tone: 'neutral', icon: ChevronsUpDown },
                  propsExpandAll,
                  { onClick: () => (expanded = containersTo(Infinity)) },
                )}
              >
                {lang.jsonExpandAll}
              </Button>
              <Button
                {...mergePartProps<ButtonProps>(
                  { size: 'sm', variant: 'ghost', tone: 'neutral', icon: ChevronsDownUp },
                  propsCollapseAll,
                  { onClick: () => (expanded = []) },
                )}
              >
                {lang.jsonCollapseAll}
              </Button>
            </div>
          )}
          <Tree
            {...mergePartProps<TreeProps<JsonViewerNode>>(
              {
                items: roots,
                getKey: (item) => item.path,
                getLabel: (item) => `${item.name}: ${display(item)}`,
                getChildren: childrenOf,
                selectionMode: 'single',
                estimateSize: 28,
                indent: 1,
                renderItem,
                'aria-label': label,
                sx: [jsonViewerStyles.tree, jsonViewerSizeStyles.maxHeight(maxHeight)],
              },
              propsTree,
              { filter: query },
            )}
            _expanded={expanded}
            _selected={selected}
          />
          <div
            {...mergeAttrs<'div'>(
              { sx: jsonViewerStyles.pathBar, ...jsonViewerPart('pathBar') },
              propsPathBar,
            )}
          >
            {node ? (
              <>
                <span
                  {...css.attrs(jsonViewerStyles.path)}
                  {...jsonViewerPart('path')}
                  title={node.path}
                >
                  {node.path}
                </span>
                {/* 两个按钮图标一样：悬停、聚焦时提示各复制什么 */}
                {(
                  [
                    [lang.jsonCopyPath, () => node.path],
                    [lang.jsonCopyValue, () => copyText(node)],
                  ] as const
                ).map(([name, text]) => (
                  <Tooltip
                    key={name}
                    trigger={(props) => (
                      <CopyButton {...props} value={text} size="sm" aria-label={name} />
                    )}
                  >
                    {name}
                  </Tooltip>
                ))}
              </>
            ) : (
              lang.jsonPathHint
            )}
          </div>
        </div>
      );
    };
  },
);
