/**
 * 组件演练场生成的代码：当前组件与调过的属性写成一段可以直接运行的 TSX（也能带进代码演练场）。
 * 只写和默认值不同的属性；图标写成 lucide 的导入名。
 */
import type { Control } from './controls';

/** 生成代码需要的信息 */
export interface CodeInput {
  /** 组件名 */
  name: string;
  /** 组件从哪个入口导入（@zerodep-dev/vue-tsx-pro-ui、@zerodep-dev/vue-tsx-pro-ui/patterns） */
  entry: string;
  /** 有控件的属性与当前值 */
  controls: readonly Control[];
  values: Readonly<Record<string, unknown>>;
  /** 各属性的默认值：相同的不写 */
  defaults: Readonly<Record<string, unknown>>;
  /** 预设固定传的属性（源码写法） */
  fixed?: Readonly<Record<string, string>>;
  /** 内容的源码；没有时自闭合 */
  children?: string;
  /** 内容里额外用到的组件库导出（主入口的） */
  imports?: readonly string[];
  /** 内容里额外用到的图标 */
  icons?: readonly string[];
}

/** 一个属性写成 JSX 属性；和默认值相同、或没值时返回 undefined */
function attribute(control: Control, value: unknown, fallback: unknown): string | undefined {
  const { name } = control.prop;
  if (value === undefined || value === fallback || value === '') return undefined;
  if (control.kind === 'icon') return `${name}={${value as string}}`;
  if (value === true) return name;
  if (typeof value === 'string' && !value.includes('"')) return `${name}="${value}"`;
  return `${name}={${JSON.stringify(value)}}`;
}

/** 生成代码 */
export function componentCode({
  name,
  entry,
  controls,
  values,
  defaults,
  fixed = {},
  children,
  imports = [],
  icons: extraIcons = [],
}: CodeInput): string {
  const attributes = [
    ...Object.entries(fixed).map(([key, code]) => `${key}=${code}`),
    ...controls.flatMap(
      (control) => attribute(control, values[control.prop.name], defaults[control.prop.name]) ?? [],
    ),
  ];
  const icons = [
    ...extraIcons,
    ...controls.flatMap((control) =>
      control.kind === 'icon' && values[control.prop.name]
        ? [String(values[control.prop.name])]
        : [],
    ),
  ];
  // 属性多时一行一个（同 Prettier）
  const opening = attributes.length
    ? attributes.join(' ').length > 60
      ? `<${name}\n${attributes.map((item) => `    ${item}`).join('\n')}\n  `
      : `<${name} ${attributes.join(' ')}`
    : `<${name}`;
  const inline = children && !children.includes('\n') && !opening.includes('\n');
  const element = !children
    ? `${opening} />`
    : inline && (opening + children).length < 70
      ? `${opening}>${children}</${name}>`
      : `${opening}>\n    ${children.split('\n').join('\n    ')}\n  </${name}>`;
  const main = '@zerodep-dev/vue-tsx-pro-ui';
  const uiImports = [...new Set([...(entry === main ? [name] : []), ...imports])].sort();
  return [
    ...(icons.length
      ? [`import { ${[...new Set(icons)].sort().join(', ')} } from '@lucide/icons';`]
      : []),
    `import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';`,
    ...(uiImports.length ? [`import { ${uiImports.join(', ')} } from '${main}';`] : []),
    ...(entry === main ? [] : [`import { ${name} } from '${entry}';`]),
    '',
    `export default _component(() => () => (`,
    `  ${element}`,
    `));`,
    '',
  ].join('\n');
}
