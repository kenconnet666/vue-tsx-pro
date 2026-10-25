/**
 * 画布导出成 SVG、PNG：整张图（不只是视口里看得见的部分），节点的 HTML 原样放进 SVG 的 foreignObject。
 *
 *   const diagram = useDiagram();
 *   downloadFile('流程.svg', diagramToSvg(diagram), 'image/svg+xml');
 *   downloadFile('流程.png', await diagramToPng(diagram), 'image/png');
 *
 * 复制随视口平移缩放的那一层，把每个元素算出来的样式（主题变量已经解析）写到它自己身上，
 * 去掉端口、对齐线、拖出来的连线和选中、焦点的描边，平移到内容的左上角（留 padding）。
 * 范围是 Diagram 的 extent，没写时包住全部节点与连线。网页字体不会被内联：看图的机器上没有时换成回退字体。
 */
import { backgroundOf, rasterizeSvg } from '../utils/dom/rasterize';
import { diagramInternals, type DiagramController } from './controller';

/** 导出的选项 */
export interface DiagramExportOptions {
  /** 内容四周留的空白（px），默认 24 */
  padding?: number;
  /** 底色，默认取画布的背景色；SVG 写 'transparent' 时透明 */
  background?: string;
}

/** 导出时去掉的元素：端口、改接把手、对齐线与拖出来的连线 */
const TRANSIENT = '[data-diagram-port],[data-diagram-transient]';

/** 整张图导出成 SVG 文字；画布还没挂载、没有内容时报错 */
export function diagramToSvg(
  diagram: DiagramController,
  options: DiagramExportOptions = {},
): string {
  const { svg } = render(diagram, options);
  return svg;
}

/** 整张图导出成 PNG（两倍分辨率，pixelRatio 可改） */
export async function diagramToPng(
  diagram: DiagramController,
  options: DiagramExportOptions & { pixelRatio?: number } = {},
): Promise<Blob> {
  const { svg, width, height } = render(diagram, options);
  return rasterizeSvg(svg, { width, height }, { scale: options.pixelRatio ?? 2 });
}

function render(diagram: DiagramController, { padding = 24, background }: DiagramExportOptions) {
  const internal = diagramInternals(diagram);
  const root = internal.element.value;
  const world = root?.querySelector<HTMLElement>('[data-diagram-world]');
  const content = internal.content();
  if (!root || !world || !content) throw new Error('diagramToSvg: 画布还没有挂载或没有内容');
  const width = Math.ceil(content.width + padding * 2);
  const height = Math.ceil(content.height + padding * 2);

  const copy = world.cloneNode(true) as HTMLElement;
  inlineStyles(world, copy);
  for (const element of copy.querySelectorAll(TRANSIENT)) element.remove();
  // 选中、焦点的描边不是图的一部分
  for (const element of copy.querySelectorAll<HTMLElement>('[data-diagram-item]')) {
    element.style.setProperty('outline-style', 'none');
  }
  copy.style.setProperty(
    'transform',
    `translate(${padding - content.x}px, ${padding - content.y}px)`,
  );

  const frame = document.createElement('div');
  frame.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
  frame.style.cssText = `position: relative; width: ${width}px; height: ${height}px; overflow: hidden; background: ${
    background ?? backgroundOf(root)
  }`;
  frame.append(copy);
  const html = new XMLSerializer().serializeToString(frame);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<foreignObject x="0" y="0" width="${width}" height="${height}">${html}</foreignObject></svg>`;
  return { svg, width, height };
}

/**
 * 会继承的属性：与父元素相同时不必写（复制品里照样继承到）。不在表里的按不继承处理，只是多写几条，结果不变
 */
const INHERITED = new Set(
  (
    'color cursor direction font-family font-size font-style font-weight font-stretch font-variant ' +
    'font-variant-ligatures font-variant-caps font-variant-numeric font-variant-east-asian font-feature-settings ' +
    'font-kerning font-optical-sizing font-variation-settings font-size-adjust font-synthesis font-palette ' +
    'letter-spacing line-height list-style-image list-style-position list-style-type quotes tab-size ' +
    'text-align text-align-last text-indent text-shadow text-transform text-rendering visibility white-space ' +
    'white-space-collapse text-wrap-mode word-break word-spacing overflow-wrap word-wrap writing-mode hyphens ' +
    'line-break caret-color color-scheme border-collapse border-spacing empty-cells caption-side pointer-events ' +
    'fill fill-opacity fill-rule stroke stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin ' +
    'stroke-miterlimit stroke-opacity stroke-width paint-order text-anchor dominant-baseline clip-rule ' +
    'shape-rendering image-rendering marker-start marker-mid marker-end orphans widows math-depth math-style ' +
    'ruby-position text-emphasis-color text-emphasis-position text-emphasis-style text-underline-position ' +
    'text-decoration-skip-ink text-size-adjust -webkit-text-fill-color -webkit-text-stroke-color ' +
    '-webkit-text-stroke-width -webkit-font-smoothing -webkit-text-size-adjust'
  ).split(/\s+/),
);

/**
 * 把原元素算出来的样式写到复制品上（类名在导出的文件里不存在），复制品去掉类名。
 * 只写导出后会变的：不继承的属性与这种元素的默认值相同时不写，继承的属性与父元素相同时不写——
 * 全部写上时一张小图也有几百 KB
 */
function inlineStyles(source: Element, target: Element) {
  const defaults = defaultStyles();
  const sources = [source, ...source.querySelectorAll('*')];
  const targets = [target, ...target.querySelectorAll('*')];
  try {
    sources.forEach((from, index) => {
      const to = targets[index] as HTMLElement | SVGElement | undefined;
      if (!to?.style) return;
      const computed = getComputedStyle(from);
      const parent =
        from === source || !from.parentElement ? null : getComputedStyle(from.parentElement);
      const initial = defaults.of(from);
      let text = '';
      for (let i = 0; i < computed.length; i++) {
        const name = computed[i]!;
        const value = computed.getPropertyValue(name);
        const same =
          parent && INHERITED.has(name)
            ? value === parent.getPropertyValue(name)
            : value === initial.getPropertyValue(name);
        if (!same) text += `${name}:${value};`;
      }
      to.setAttribute('style', text);
      to.removeAttribute('class');
    });
  } finally {
    defaults.dispose();
  }
}

/**
 * 各种元素的默认样式：在一个 all: initial 的容器里各放一个同名元素读出来（容器不继承页面的字体、颜色，
 * 同导出后 foreignObject 里的情形）。按命名空间与标签缓存，用完 dispose 移除容器
 */
function defaultStyles() {
  const sandbox = document.createElement('div');
  sandbox.style.cssText =
    'all: initial; position: fixed; left: -100000px; top: 0; contain: strict;';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  sandbox.append(svg);
  document.body.append(sandbox);
  const cache = new Map<string, CSSStyleDeclaration>();
  return {
    of(element: Element) {
      const key = `${element.namespaceURI}|${element.localName}`;
      let style = cache.get(key);
      if (!style) {
        const sample = document.createElementNS(element.namespaceURI, element.localName);
        (element instanceof SVGElement && element.localName !== 'svg' ? svg : sandbox).append(
          sample,
        );
        style = getComputedStyle(sample);
        cache.set(key, style);
      }
      return style;
    },
    dispose: () => sandbox.remove(),
  };
}
