# @unovis/ts 1.7.1 API reference (for Vue TSX wrappers)

Source of truth: `node_modules/.pnpm/@unovis+ts@1.7.1/node_modules/@unovis/ts` (`components/*/config.d.ts`, `index.d.ts`, `style.js`, `containers/*`, `types/*`).
No `exports` field in package.json: subpaths like `@unovis/ts/maps` resolve to root files (`maps.js`). Everything else is the barrel `@unovis/ts`.
Class names: `Boxplot` (not BoxPlot), `Heatmap` (not HeatMap), `TopoJSONMap`, `FreeBrush`, `XYLabels`.

---
## 0. Shared building blocks

### Common config (every component, `ComponentConfigInterface`)
- `duration?: number` — transition ms, default `600` (Plotline/Plotband: `300`). Container `duration` overrides all components inside it.
- `events?: { [selector: string]: { [VisEventType]?: (datum, event, i, els) => void } }` — key is a class selector string from `Comp.selectors.xxx` (e.g. `[Area.selectors.area]: { click: d => … }`). `VisEventType` = touchstart|touchmove|touchend|mouseover|mousemove|mousedown|mouseup|click|auxclick|contextmenu|dblclick|mouseenter|mouseleave|mouseout|scroll|select|wheel|pointerdown|pointerup|pointerout|pointermove.
  - Callbacks are resolved at dispatch time, so `setConfig` with new callbacks is safe; the DOM re-bind itself is throttled 500 ms.
  - Datum shapes differ per selector: Scatter point = `ScatterPoint<Datum>`; Line gets `Datum[]` (whole series); Sankey node = `SankeyNode`, link = `SankeyLink`; Graph node/link = `GraphNode`/`GraphLink`; Chord node = `ChordNode`, link = `ChordRibbon`; Treemap tile = `TreemapNode`; Donut/RadialBar segment = `{data, index, …}` (d3 arc datum; `d.data` is original).
- `attributes?: { [selector]: { [attr]: const | (datum) => … } }` — custom DOM attributes (e2e tests).
- Every component instance: `setConfig(cfg)`, `setData(data)`, `destroy()`, `isDestroyed()`, `static selectors` (CSS class names), `render(duration?)`. Containers call setSize/render; do not call manually.

### Common XY config (`XYComponentConfigInterface<Datum>`; Area, Line, Scatter, StackedBar, GroupedBar, Boxplot, Timeline, XYLabels, Crosshair, Axis, Plotline, Plotband, Brush, FreeBrush)
- `x: NumericAccessor<Datum>` — required for most (Plotline/Plotband/Brush/FreeBrush/Axis/Crosshair: optional).
- `y: NumericAccessor | NumericAccessor[]` — array = multiple series (one accessor per series). Required (optional for Boxplot, Timeline).
- `id?: (d, i) => string` — stable key for data diffing, default `(d,i) => d.id ?? i`.
- `color?: ColorAccessor` — default `d => d.color`; see per-component for what the accessor receives.
- `colorKeys?: string[]` — same length as `y`; maps keys to `colorFunction`.
- `xScale?`, `yScale?: ContinuousScale` — usually leave unset (container owns scales). If set, you own domain+range.
- `excludeFromDomainCalculation?: boolean` (default false) — keep a component out of the shared domain.

### Accessor types (`types/accessor`)
- `NumericAccessor<D> = ((d, i, …) => number|null|undefined) | number | null | undefined`
- `StringAccessor`, `BooleanAccessor`, `GenericAccessor<R,D>` same shape. `ColorAccessor<D> = ((d,i,key?) => string|null|undefined) | string | string[] | null | undefined` (array = cycled by index/series index).
- `ColorFunction = (key: string|number) => string` (container-level fallback).

### Container-level config (`ContainerConfigInterface`, both containers)
- `duration`, `margin: Spacing`, `padding: Spacing` (`{left,right,top,bottom}` numbers, default 0), `width`, `height` (number|CSS units; `%` not supported, use CSS on the host element), `sizing: Sizing.Fit|Extend|FitWidth` (default `Fit`), `svgDefs: string` (custom SVG defs, needed for Timeline icons / Graph custom icons), `ariaLabel` (set on the wrapping div; svg itself is `aria-hidden`), `colorFunction`.
- Height: if neither `height` nor host element height is known, falls back to `ContainerCore.DEFAULT_CONTAINER_HEIGHT = 300`. Host element needs explicit height (CSS) for `Fit`.
- Container uses a ResizeObserver on the host element (auto re-render on resize; tooltip hidden on resize).

### Enums / value types
- `CurveType`: basis, basisClosed, basisOpen, bundle, cardinal, cardinalClosed, cardinalOpen, catmullRom(+Closed/Open), linear, linearClosed, monotoneX, monotoneY, natural, step, stepAfter, stepBefore.
- `Position`: top|bottom|left|right|center|auto. `Orientation`: horizontal|vertical. `Arrangement`: inside|outside|center. `Direction`: west|east|north|south.
- `SymbolType`: circle|cross|diamond|square|star|triangle|wye. `TrimMode`: start|middle|end. `FitMode`: wrap|trim. `TextAlign`: left|center|right. `VerticalAlign`: top|middle|bottom.
- `FillPatternType`: stripes-diagonal|dots|stripes-vertical|crosshatch|waves|circles; `LinePatternType`: circle|triangle|diamond|arrow|square|star. Patterns apply via `pattern` accessors and activate when `body.theme-patterns` is set (otherwise default patterns only show with that class).
- `LengthUnit = number | \`${number}%\` | \`${number}px\``. `Spacing = {left?,right?,top?,bottom?}`.
- `UnovisText = { text, fontSize?, fontFamily?, fontWeight?, color?, lineHeight?, marginTop?, marginBottom?, className?, width?, separator?, wordBreak? }` (rich label blocks).

### Colors (global)
- Default palette: `--vis-color0..5` = `#4D8CFD #FF6B7E #F4B83E #A6CC74 #00C19A #6859BE` (dark theme variant differs in #3, #5). **Only 6 colors, cycled modulo 6.** `--vis-color-main` = color0; `--vis-color-main-light/dark` derived; `--vis-color-grey: #2a2a2a`.
- Fallback color for a datum without a color: `getColor()` → `colorFunction(key|index % 6)` → `var(--vis-colorN)`.
- `--vis-font-family` (default `Inter, Arial, …`), `--vis-font-wh-ratio` (0.5; text width estimation).
- Dark theme switch is detected by selectors `html[data-theme="dark"], html.dark-theme, body.dark-theme, html.theme-dark, body.theme-dark` (sets `--vis-dark-*` overrides and `--vis-colorN`). `isDarkThemeEnabled()` checks `data-theme="dark"` or classes `dark-theme`/`theme-dark` on `html`/`body`.
- Setting colors from code: any CSS color string; `var(--x)` works for fill/stroke. Gotcha: components that compute label contrast (Scatter, XYLabels, Treemap, Donut/NestedDonut labels, TopoJSONMap points, Graph) call `getHexValue()` which only resolves a string that is exactly `var(--name)` (no fallback, no `color-mix()`/`light-dark()`), reads from `document.body`, and **caches per variable name in a WeakMap forever** → label light/dark choice goes stale after a runtime theme switch. Tokens that are plain `var(--x)` work, others silently fall back to no brightness (`color()` returns undefined).

---
## 1. Containers

### XYContainer<Datum>  (`new XYContainer(el: HTMLElement, config?, data?: Datum[])`)
Data: flat `Datum[]`; every XY component receives the same array.
Config (`XYContainerConfigInterface<Datum>` + container common):
- `components: XYComponentCore<Datum>[]` (default `[]`) — Area, Line, Scatter, StackedBar, GroupedBar, Boxplot, Timeline, XYLabels, Plotline, Plotband, Brush, FreeBrush.
- `xAxis?, yAxis?: Axis<Datum>`; `tooltip?: Tooltip`; `crosshair?: Crosshair<Datum>`; `annotations?: Annotations`.
- Scales/domains: `xScale?, yScale?: ContinuousScale` (shared instance if set), `xDomain?, yDomain?: [number|undefined, number|undefined]`, `xDomainMinConstraint/xDomainMaxConstraint/yDomainMinConstraint/yDomainMaxConstraint: [min?, max?]`, `xRange?, yRange?: [number, number]` (pixel), `yDirection?: Direction.North|South` (default North; South flips y), `scaleByDomain?: boolean` (y domain from visible x range, default false), `preventEmptyDomain?: boolean|null` (default `null`: extend only when no data; `true`: extend whenever equal).
- Layout: `autoMargin?: boolean` (default true; margin from axis sizes), `clipPathExtend?: number` (default 2), `bleed?: Spacing | ((components) => Spacing)` (override auto bleed, e.g. half a scatter point).
- `onRenderComplete?(svg, margin, bleed, containerWidth, containerHeight, componentWidth, componentHeight)`.
- + `duration, margin, padding, sizing, width, height, svgDefs, ariaLabel, colorFunction`.
API:
- `setData(data, preventRender?)` — **ignored if `data` falsy**; same array reference (`!==` check) → only hides tooltip/crosshair when changed. Pass a new array to trigger update.
- `updateContainer(containerConfig, preventRender?)`; `updateComponents(componentConfigs[], preventRender?)` — configs matched **by index** to `config.components` (warns on length mismatch); `update(containerConfig, componentConfigs?, data?)` renders once.
- `get components`, `width`, `height` (inner area), `render(duration?)`, `destroy()`.
- `destroy()` removes the svg and **destroys all components, tooltip, crosshair, annotations, xAxis, yAxis** → instances cannot be reused afterwards (recreate them, even if kept in a cache map).
- Side effect: inserts `<filter id="saturate">` into svg defs (duplicate ids across charts; our XYChart renames it) and sets CSS var `--highlight-filter-id`.
- `document.fonts.ready` triggers an axis re-render after first render.

### SingleContainer<Data>  (`new SingleContainer(el, config?, data?: Data)`)
Hosts exactly one component of any `ComponentCore<Data>` (Donut, NestedDonut, RadialBar, Treemap, Sankey, ChordDiagram, Graph, TopoJSONMap, Heatmap, LeafletMap…). `Data` is the component's data type (arrays for Donut etc., `{nodes, links}` for graph-like).
Config (`SingleContainerConfigInterface<Datum>` + container common): `component: ComponentCore<Datum>` (**required whenever updateContainer is called**), `tooltip?: Tooltip`, `annotations?: Annotations`, `onRenderComplete?(svg, margin, containerWidth, containerHeight, componentWidth, componentHeight)`.
API differences vs XYContainer:
- `setData(data, preventRender?)` — sets `component.setData(data)` unconditionally (no falsy guard, no shared datamodel); hides tooltip only if the data reference changed.
- `updateContainer(cfg, preventRender?)` — **reassigns `this.component = cfg.component`**: calling it with a config missing `component` leaves `component` undefined and breaks render. Also applies `cfg.sizing` to the component (`this.component.sizing = …`; crashes if `component` undefined and `sizing` set).
- `updateComponent(componentConfig, preventRender?)` (singular; vs `updateComponents(array)`) → `component.setConfig`.
- `update(containerConfig, componentConfig?, data?)` — data applied only if truthy.
- `getFitWidthScale()` — only meaningful for components with `getWidth()` (Sankey, Heatmap).
- `Sizing.Extend` / `Sizing.FitWidth` only work with components implementing `ExtendedSizeComponent` (`getWidth/getHeight`: Sankey, Heatmap with `cellSize`); container sets svg width/height/viewBox from the component size instead of host size.
- `destroy()` destroys component, tooltip, annotations.
- No axes/crosshair/scales/domains.

---
## 2. XY components (use in XYContainer)

### Axis<Datum>  (container `xAxis`/`yAxis`; container forces `config.type` = X/Y)
- `type: AxisType.X|Y ('x'|'y')`, `position?: Position`, `label?`, `labelFontSize?: string|null`, `labelMargin?` (8), `labelColor?: string|null`, `labelTextFitMode?` (wrap), `labelTextTrimType?`, `labelTextSeparator?`.
- Lines: `gridLine?` (true), `tickLine?` (true), `domainLine?` (true), `fullSize?` (true).
- Ticks: `tickFormat?: (tick: number|Date, i, ticks) => string`, `tickValues?: number[]`, `numTicks?`, `tickSpacing?` (175, x only), `tickPadding?` (8), `tickSize?: number | [inner, outer]` (6), `minMaxTicksOnly?`, `minMaxTicksOnlyShowGridLines?`, `minMaxTicksOnlyWhenWidthIsLess?` (250), `tickTextAdaptiveSets?` (fit largest nice tick set that does not overlap), `tickTextHideOverlapping?`.
- Tick text: `tickTextFitMode?`, `tickTextWidth?`, `tickTextSeparator?`, `tickTextForceWordBreak?`, `tickTextTrimType?`, `tickTextFontSize?: string|null`, `tickTextAlign?: TextAlign | fn`, `tickTextColor?: string|null`, `tickTextAngle?`.
- CSS vars: `--vis-axis-font-family`, `--vis-axis-tick-color` (#e8e9ef tick line), `--vis-axis-domain-color` (domain line), `--vis-axis-domain-line-width`, `--vis-axis-domain-line-dasharray`, `--vis-axis-grid-color` (#e8e9ef), `--vis-axis-grid-line-width` (1px), `--vis-axis-grid-line-dasharray`, `--vis-axis-grid-opacity`, `--vis-axis-grid-transition`, `--vis-axis-label-font-size` (14px), `--vis-axis-label-color` (#6c778c), `--vis-axis-label-weight` (500), `--vis-axis-tick-label-color` (#6c778c), `--vis-axis-tick-label-font-size` (12px), `--vis-axis-tick-label-weight` (500), `--vis-axis-tick-label-cursor`, `--vis-axis-tick-label-text-decoration`, `--vis-axis-tick-line-width` (1px), `--vis-axis-tick-label-hide-transition`, + `--vis-dark-axis-*`.
- Gotcha: category axes need `tickValues` + `tickFormat` mapping index → label (what XYChart does); `tickFormat` receives `number|Date`.

### Area<Datum>  (stacked areas; `stacked = true`)
- Data: `Datum[]`; `x`, `y: Accessor[]` (each y = one stacked layer).
- `color?: ColorAccessor<Datum[]>` (**gets the whole data array + layer index**: `(data, i)`), `pattern?`, `curveType?` (MonotoneX), `baseline?: NumericAccessor<Datum>`, `opacity?: NumericAccessor<Datum[]>` (1), `cursor?`, `line?: boolean` (false; top stroke), `lineColor?`, `lineWidth?` (2), `lineDashArray?`, `linePattern?`, `minHeight?`, `stackMinHeight?`, `minHeight1Px?` (deprecated).
- Selectors: `area`, `areaLinePath`.
- CSS: `--vis-area-fill-opacity` (1), `--vis-area-stroke-color` (none), `--vis-area-stroke-width` (0px), `--vis-area-stroke-dasharray`, `--vis-area-stroke-opacity`, `--vis-area-hover-fill-opacity` (none), `--vis-area-hover-stroke-width`, `--vis-area-cursor`, `--vis-line-stroke-dasharray/-dashoffset` (shared with line), `--vis-dark-area-stroke-color`.
- Gotchas: stacked cumulatively — negative values stack separately (`_prevNegative`). Null values break/zero areas. For Crosshair on stacked data use `yStacked`.

### Line<Datum>
- Data `Datum[]`; `y` array = one line per accessor.
- `color?: ColorAccessor<Datum[]>` (whole array, `(data, i)` i = line index), `pattern?`, `curveType?` (MonotoneX), `lineWidth?` (2), `lineDashArray?`, `fallbackValue?: number|null|undefined` (default undefined = break the line at missing values; `null` = treat as 0), `highlightOnHover?` (false), `cursor?`, `interpolateMissingData?` (false; draws dashed fill across gaps).
- Selectors: `line`, `linePath`, `lineSelectionHelper`, `dim`, `interpolatedPath`. Events default: mouseover(datum), mouseleave.
- CSS: `--vis-line-stroke-dasharray` (none), `--vis-line-stroke-dashoffset`, `--vis-line-cursor`, `--vis-line-gapfill-stroke-dasharray` (2 3), `--vis-line-gapfill-stroke-opacity` (0.8), `--vis-line-gapfill-stroke-dashoffset`.
- Gotcha: no dedicated stroke-color var; color comes from the `color` accessor/`--vis-colorN`. `curveType` accepts only `CurveType` (not string) here.

### Scatter<Datum>
- Data `Datum[]`; `x`, `y` (single or array = point per y).
- `color?: ColorAccessor<Datum>`, `pattern?`, `size?: NumericAccessor` (10 px diameter; if `sizeRange` set it's input to `sizeScale`), `sizeScale?` (`scaleSqrt`), `sizeRange?: [min,max]`, `shape?: SymbolType | fn` (circle), `label?`, `labelColor?`, `labelHideOverlapping?` (true), `labelTextBrightnessRatio?` (0.65), `labelPosition?: Position|fn` (bottom), `strokeColor?`, `strokeWidth?`, `cursor?`.
- Selectors: `pointGroup`, `pointGroupExit`, `point`. Default events: mouseenter/mouseleave(point, event).
- CSS: `--vis-scatter-fill-color` (var(--vis-color-main)), `--vis-scatter-stroke-color` ('none'), `--vis-scatter-stroke-width` (1px), `--vis-scatter-fill-opacity`, `--vis-scatter-stroke-opacity`, `--vis-scatter-hover-stroke-width` (2px), `--vis-scatter-cursor`, `--vis-scatter-point-label-text-color-dark` (#5b5f6d), `-light` (#fff), `-font-weight` (500), `-font-size` (12px), `-font-family`.
- Gotcha: labels pick dark/light text by `getHexValue(color)` brightness (see Colors gotcha). Container bleed auto-extended by half the point size.

### StackedBar<Datum>  /  GroupedBar<Datum>
- Data `Datum[]`; `x`, `y: Accessor[]` (one per series; stacked vs side by side).
- Shared: `color?: ColorAccessor<Datum>` (**called per datum with `(d, seriesIndex)`**), `pattern?`, `barStyle?: GenericAccessor<StyleDeclaration, Datum>` (inline styles; fill/opacity/cursor/mask stay animated), `roundedCorners?: number|boolean` (2), `cursor?`, `orientation?: Orientation` (vertical), `dataStep?` (x-units between bars; set when x has gaps), `barPadding?` (0..1; Stacked 0, Grouped 0).
- StackedBar only: `baseline?: NumericAccessor<Datum>` (floating/waterfall start), `barWidth?`, `barMaxWidth?`, `barMinHeight1Px?`, `barMinHeightZeroValue?`.
- GroupedBar only: `groupWidth?`, `groupMaxWidth?`, `groupPadding?` (0.05), `barMinHeight?` (1).
- Selectors: `bar`, `barGroup`, `barGroupExit`.
- CSS (stacked): `--vis-stacked-bar-fill-color` (var(--vis-color-main)), `-stroke-color` (none), `-stroke-width` (0px), `-hover-stroke-width` (none), `-hover-stroke-color`, `-cursor`, `--vis-dark-stacked-bar-stroke-color`. CSS (grouped): same with `--vis-grouped-bar-*`; `hover-stroke-width` default **1px** (we set 0).
- Gotchas: bar width derived from x spacing → use `dataStep` with gaps; horizontal orientation: x is the category/position along... in horizontal mode Y axis carries categories (`xDomain` holds values, see XYChart `horizontal` switching of domains/axes).

### Boxplot<Datum>
- Data `Datum[]`; `x` (position), `y` optional. `median: NumericAccessor`, `quartiles: [q1,q3]` accessor, `whiskers: [min,max]` accessor.
- `color?`, `barWidth?`, `barMaxWidth?`, `dataStep?`, `barPadding?` (0.25), `roundedCorners?` (2), `cursor?`.
- Selectors: `boxGroup`, `boxGroupExit`, `box`, `median`, `whisker`, `whiskerCap`.
- CSS: `--vis-boxplot-fill-color` (var(--vis-color-main)), `-fill-opacity` (0.2), `-stroke-color`, `-stroke-width` (1.5px), `-median-stroke-color/-width`, `-whisker-stroke-color/-width`, `-cursor`.
- Gotcha: outliers are not drawn (no outlier API; add a Scatter with `excludeFromDomainCalculation: false`). Y domain comes from whiskers.

### Timeline<Datum>
- Data `Datum[]` where each item = one segment: `x` = start (number, e.g. ms), `lineDuration` = length in x units, `lineRow` = row key (string); `y` optional.
- Row/line: `lineRow?: StringAccessor` (old `type`), `lineDuration?: NumericAccessor` (old `length`), `lineWidth?` (8), `lineCap?` (true), `color?`, `pattern?`, `lineCursor?`, `showEmptySegments?`, `showEmptySegmentsCorrectPosition?` (true).
- Icons: `lineStartIcon/lineEndIcon: StringAccessor` (href to symbol in container `svgDefs`), `lineStart/EndIconColor`, `…IconSize`, `…IconArrangement`.
- Rows: `rowHeight?` (22), `alternatingRowColors?` (true), `showRowLabels?` (false), `rowLabelFormatter?(key, items, i)`, `rowLabelStyle?`, `rowIcon?(key, items, i)` → `{href,size,color}`, `rowLabelWidth?`, `rowMaxLabelWidth?`, `rowLabelTextAlign?` (right), `rowLabelTrimMode?` (middle), `rowLabelMargin?` (`[0,5]`), `rowFillEmptySpace?`.
- `arrows?: TimelineArrow[]` (`lineSourceId`, `lineTargetId`, …), `animationLineEnterPosition?`, `animationLineExitPosition?`, `onScroll?(scrollTop)` (vertical scroll inside component).
- Selectors: `background, lines, lineGroup, line, lineStartIcon, lineEndIcon, arrows, arrow, rows, row, rowOdd, scrollbar, scrollbarHandle, scrollbarBackground, labels, label, labelBackground, rowIcons, rowIcon`. Default event: wheel.
- CSS: `--vis-timeline-row-even-fill-color` (#FFF), `-row-odd-fill-color` (#F7FAFC), `-row-background-opacity`, `-scrollbar-background-color` (#E6E9F3), `-scrollbar-color` (#9EA7B8), `-label-font-size` (12px), `-label-color` (#6C778C), `-label-user-select`, `-label-pointer-events`, `-arrow-color`, `-arrow-stroke-width`, `-cursor`, `-line-color` (var(--vis-color-main)), `-line-stroke-color/-width`, `-line-hover-stroke-width/-color`, `-row-icon-cursor`; dark variants for rows/scrollbar/labels/arrow.
- Gotcha: the one XY component with its own vertical scroll + fixed row height (container height must fit rows or scroll appears); typically combine with an x Axis only (no yAxis); several deprecated aliases (`type`, `length`, `cursor`, `showLabels`, `labelWidth`, `maxLabelWidth`).

### Plotline<Datum>  (reference line)
- No data; `value?: number|null` (0), `axis?: AxisType` (**default Y**: a horizontal line at y=value; use `AxisType.X` for vertical), `color?: string`, `lineWidth?` (2), `lineStyle?: PlotlineLineStylePresets | number[]` (solid|dash|dashDot|dot|longDash|longDashDot|longDashDotDot|shortDash|shortDashDot|shortDashDotDot|shortDot), `duration?` (300).
- Label: `labelText?: string | UnovisText | UnovisText[]`, `labelPosition?: PlotlineLabelPosition` (top-left|top|top-right|right|bottom-right|bottom|bottom-left|left; default top-right), `labelOffsetX/Y?` (14), `labelOrientation?` (horizontal|vertical), `labelColor?`, `labelSize?` (px).
- Selectors: `plotline`, `label`. Reports extra `bleed` for the label (don't clip).
- CSS: `--vis-plotline-color` (rgb(226,32,58)), `--vis-plotline-width` (2), `--vis-plotline-dasharray`, `--vis-plotline-stroke-dashoffset`, `--vis-plotline-label-font-size` (12px), `--vis-plotline-label-color` (#000), `--vis-dark-plotline-label-color`.
- Gotcha: it is an XY component (config `Partial<XYComponentConfigInterface>`); `x`/`y` accessors not needed but data array must still be set on the container.

### Plotband<Datum>  (shaded band)
- `from?`, `to?: number|null` (0,0), `axis?: AxisType` (Y default), `color?: string` (var(--vis-plotband-color)), `duration?` (300).
- Label: `labelText?`, `labelPosition?: PlotbandLabelPosition` (`<top|right|bottom|left|top-left|…>-<inside|outside>`, default `top-left-outside`), `labelOffsetX/Y?` (14), `labelOrientation?`, `labelColor?`, `labelSize?`.
- Selectors: `plotband`, `label`. CSS: `--vis-plotband-color` (rgba(255,255,90,.2)), `--vis-plotband-cursor`, `--vis-plotband-label-font-size` (12px), `--vis-plotband-label-color`, `--vis-dark-plotband-color`, `--vis-dark-plotband-label-color`.

### Brush<Datum>  (x-range brush, usually overlays a small "navigator" chart)
- `selection?: [number, number] | null` (data-space; controls selection), `draggable?` (false), `handleWidth?` (1), `handlePosition?: Arrangement.Inside|Outside` (inside), `selectionMinLength?`, `brushHeightExtend?` (0).
- Callbacks: `onBrush`, `onBrushStart`, `onBrushMove`, `onBrushEnd`: `(selection: [number,number]|undefined, event: D3BrushEvent, userDriven: boolean) => void`. Check `userDriven` to ignore programmatic echoes.
- Selectors: `brush`, `unselected`, `handleLine`, `root`. 
- CSS: `--vis-brush-selection-fill-color` (none), `-selection-stroke-color`, `-selection-stroke-width` (0), `-selection-opacity` (0), `-unselected-fill-color` (#0b1640), `-unselected-stroke-color` (#acb2b9), `-unselected-stroke-width` (0), `-unselected-opacity` (0.4), `-handle-fill-color` (#6d778c), `-handle-stroke-color` (#eee), + `--vis-dark-brush-*`.
- Gotcha: not clippable; selection in data units, so a 2-chart "zoom + navigator" needs both charts' `xDomain` updated from `onBrush`.

### FreeBrush<Datum>  (selection rectangle for filtering, X / Y / XY)
- `mode?: FreeBrushMode.X|Y|XY` (X), `selection?: [number,number] | [[xMin,xMax],[yMin,yMax]] | null`, `selectionMinLength?: number|[number,number]`, `handleWidth?` (1), `autoHide?` (true; hides after selection ends), callbacks `onBrush/onBrushStart/onBrushMove/onBrushEnd(selection|undefined, event, userDriven)`.
- Selectors: `brush`, `hide`. CSS: `--vis-free-brush-selection-fill-color` (#0b1640), `-selection-fill-opacity` (0.4), `-selection-stroke-color` (#acb2b9), `-handle-fill-color` (#6d778c), `-handle-stroke-color` (none), + dark.

### XYLabels<Datum>  (text labels in data/screen space, with clustering)
- `x`, `y: NumericAccessor` (**single y only**), `label?: StringAccessor`, `color?`, `backgroundColor?`, `labelFontSize?` (px; else `--vis-xy-label-font-size`), `labelTextBrightnessRatio?` (0.65), `cursor?`.
- Positioning: `xPositioning?`, `yPositioning?: XYLabelPositioning.DataSpace|AbsolutePx|AbsolutePercentage` (default DataSpace).
- Clustering: `clustering?` (**true by default**), `clusterLabel?`, `clusterFontSize?`, `clusterBackgroundColor?`, `clusterCursor?`, `clusterLabelColor?`.
- Selectors: `labelGroup`, `cluster`, `label`. CSS: `--vis-xy-label-cursor`, `-stroke-color`, `-stroke-width`, `-fill-opacity`, `-stroke-opacity`, `-hover-stroke-width` (1px), `-font-size` (12px), `-cluster-font-size` (14px), `-text-color-dark` (#5b5f6d), `-text-color-light` (#fff), `-text-font-weight` (500).

### Crosshair<Datum>  (container `crosshair`; hover vertical line + circles + tooltip)
- Data from container; `x?`, `y?` accessors optional (set `y` to the series accessors so circles can be drawn), `yStacked?: NumericAccessor[]`, `baseline?`.
- Circles: `color?: ColorAccessor<Datum>` (called per series: `(d, seriesIndex)`), `strokeColor?`, `strokeWidth?`, `circleRadius?` (3), `getCircles?: (x, data, yScale, leftNearestDatumIndex?) => {y, color, opacity?, id?, strokeColor?, strokeWidth?}[]` (return `[]` for no dots).
- Behavior: `snapToData?` (true), `snapMode?: CrosshairSnapMode.X|XY` (X), `hideWhenFarFromPointer?` (true), `hideWhenFarFromPointerDistance?` (100), `showHorizontalLine?` (false), `forceShowAt?: number|Date`, `skipRangeCheck?`, `visibilityThreshold?` (0.35 fraction of chart in viewport; lower for tall charts).
- Tooltip: `tooltip?: Tooltip` (auto-assigned by container), `template?: (datum, x: number|Date, data, leftNearestDatumIndex?) => string | HTMLElement` (default `''`; with `snapToData:false` `datum` is undefined).
- `onCrosshairMove?(x?, datum?, datumIndex?, event?)` (all undefined on mouse-out).
- Selectors: `line`, `lineHorizontal`, `circle`.
- CSS: `--vis-crosshair-line-stroke-color` (#888), `-line-stroke-width` (1px), `-line-stroke-opacity` (1), `-line-stroke-dasharray`, `-circle-stroke-color` (#fff), `-circle-stroke-width` (1px), `-circle-stroke-opacity` (0.75), + dark.

### Annotations  (container `annotations`, both containers; not an XY component)
- `items: AnnotationItem[] | undefined` (required): `{ content: string | UnovisText | UnovisText[], x?: LengthUnit, y?: LengthUnit, width?: LengthUnit, height?: LengthUnit, subject?: { x, y (LengthUnit | () => LengthUnit), radius?, fillColor?, strokeColor?, strokeDasharray?, padding?, connectorLineColor?, connectorLineStrokeDasharray? }, cursor?, + UnovisTextOptions (textAlign, verticalAlign, textRotationAngle, separator, wordBreak, fastMode) }`.
- `renderTextBoundingBoxes?` (debug). Positions are in container pixels / % of container (`'50%'`), not data space.
- Selectors: `annotation`, `annotationSubject`, `annotationContent`, `debugBoundingBox`.
- CSS: `--vis-annotations-text-color` (#282C34), `-connector-stroke-color` (#444), `-connector-stroke-width` (1px), `-connector-stroke-dasharray`, `-subject-stroke-color` (#444), `-subject-fill-color` (none), `-subject-stroke-dasharray`, `-debug-bounding-box-stroke-color`.

---
## 3. Single-container components

### Donut<Datum>  data `Datum[]`
- `value: NumericAccessor` (required), `id?` (`d.id ?? i`), `color?: ColorAccessor<Datum>`, `pattern?`, `sortFunction?`.
- Geometry: `angleRange?: [rad, rad]` (`[0, 2π]`; half donut via constants `DONUT_HALF_ANGLE_RANGE_TOP/RIGHT/BOTTOM/LEFT`), `padAngle?` (0), `cornerRadius?` (0), `radius?` (auto = fit), `arcWidth?` (20 px; **0 = pie**), `minSegmentAngle?`, `showEmptySegments?` (false), `emptySegmentAngle?` (0.5°).
- Center: `centralLabel?: string`, `centralSubLabel?: string`, `centralSubLabelWrap?` (true), `centralLabelOffsetX/Y?`.
- Background track: `showBackground?` (true), `backgroundAngleRange?`.
- Selectors: `background`, `segment`, `segmentExit`, `centralLabel`, `centralSubLabel`. Segment events datum: d3 arc datum (`d.data` = your datum).
- CSS: `--vis-donut-central-label-font-size` (16px), `-central-label-text-color` (#5b5f6d), `-central-label-font-weight` (600), `-central-sub-label-font-size` (12px), `-central-sub-label-text-color`, `-central-sub-label-font-weight` (500), `--vis-donut-background-color` (#E7E9F3), `--vis-donut-segment-stroke-width` (0), + dark.
- Gotcha: `centralLabel` is a plain string (not an accessor despite the doc comment). With total value 0 and `showEmptySegments:false` nothing draws.

### NestedDonut<Datum>  data `Datum[]` (flat rows grouped by `layers`)
- `layers: StringAccessor<Datum>[]` (required; each accessor defines one ring's grouping, outermost→innermost unless `direction` says otherwise), `value?: NumericAccessor` (leaf weight; default counts rows), `direction?: NestedDonutDirection.Inwards|Outwards`, `angleRange?`, `cornerRadius?` (0), `layerPadding?`, `layerSettings?: GenericAccessor<{backgroundColor?, labelAlignment?: NestedDonutSegmentLabelAlignment (along|perpendicular|straight), width?: number|string}, layerIndex>`.
- Segments: `segmentColor?: ColorAccessor<NestedDonutSegment>`, `segmentPattern?`, `segmentLabel?`, `segmentLabelColor?`, `showSegmentLabels?` (true), `hideOverflowingSegmentLabels?` (true), `showEmptySegments?`, `emptySegmentAngle?` (1°), `sort?(a,b)`.
- Center: `centralLabel?`, `centralSubLabel?`, `centralSubLabelWrap?`; `showBackground?` (false).
- Selectors: `segmentsGroup`, `background`, `segment`, `segmentExit`, `segmentArc`, `segmentLabel`, `centralLabel`, `centralSubLabel`.
- CSS: `--vis-nested-donut-font-family`, `-background-color` (#E7E9F3), `-central-label-font-size` (16px), `-central-label-font-weight` (600), `-central-label-text-color` (#5b5f6d), `-central-sublabel-font-size` (note: default value literally `"12px;"`), `-central-sublabel-font-weight`, `-central-sublabel-text-color`, `-segment-stroke-width` (1px), `-segment-stroke-color` (= background color), `-segment-label-text-color-light` (#5b5f6d, used on light fills), `-segment-label-text-color-dark` (#fff, used on dark fills), `-segment-label-font-size` (1em).
- Gotcha: `layers` is required; hierarchy is built by d3-hierarchy; colors by layer-1 key by default (no `color`, use `segmentColor`).

### RadialBar<Datum>  data `Datum[]` (one datum = one ring)
- `value: NumericAccessor` (required; null/undefined => no bar), `id?`, `maxValue?: NumericAccessor | number[]` (full-ring value; default data max), `color?`, `sortFunction?`, `reverseOrder?` (data[0] innermost).
- Geometry: `angleRange?` (`[0,2π]`), `padAngle?` (0), `barMinAngle?` (0.01 rad; 0 disables), `cornerRadius?` (0), `radius?` (outer radius of outermost ring), `trackWidth?` (16 px), `trackPadding?` (4 px), `showBackground?` (true), `backgroundAngleRange?`.
- Center: `centralLabel?`, `centralSubLabel?`, `centralSubLabelWrap?`, `centralLabelOffsetX/Y?`.
- Selectors: `background`, `bar`, `barExit`, `centralLabel`, `centralSubLabel`.
- CSS: `--vis-radial-bar-central-label-font-size` (24px), `-central-label-text-color` (#5b5f6d), `-central-label-font-family`, `-central-label-font-weight` (600), `-central-label-text-anchor`, `-central-sub-label-*` (12px/#5b5f6d/500), `--vis-radial-bar-background-color` (#E7E9F3), `-bar-stroke-width` (0), `-bar-stroke-color`, + dark.

### Treemap<Datum>  data `Datum[]` (flat rows grouped by `layers`)
- `layers: StringAccessor<Datum>[]` (required), `value?: NumericAccessor` (tile area), `id?`.
- Tiles: `tileColor?: ColorAccessor<TreemapNode>`, `tileLabel?: (node) => string` (default "key: value"; `numberFormat` deprecated), `tileFunction?` (d3 `treemapSquarify`, `treemapDice`, …), `tileSort?`, `tilePadding?` (2), `tilePaddingTop?`, `tileBorderRadius?` (2), `tileBorderRadiusFactor?` (1/8), `tileShowHtmlTooltip?` (SVG `<title>`), `showTileClickAffordance?`, `enableLightnessVariance?` (false), `lightnessVariationAmount?` (0.08).
- Labels: `labelInternalNodes?` (false), `labelOffsetX/Y?` (4), `labelFit?: FitMode` (wrap), `labelTrimMode?` (middle), `minTileSizeForLabel?` (20), `enableTileLabelFontSizeVariation?`, `tileLabelSmallFontSize?` (8) / `Medium` (12) / `Large` (24).
- Selectors: `tiles`, `tileGroup`, `tile`, `tileExiting`, `clickableTile`, `tileForeground`, `label`, `internalLabel`, `labelGroup`.
- CSS: `--vis-treemap-tile-stroke-color` (#fff), `-tile-stroke-width` (2px), `-tile-hover-stroke-color` (#fff), `-tile-hover-stroke-opacity` (0), `-label-opacity` (0.8), `-label-font-weight`, `-label-text-color` (#000), `-label-text-color-light` (#fff), `-label-font-size` (12px), + dark.
- Gotcha: light/dark label text chosen from tile fill brightness (see Colors gotcha); values must be non-negative numbers.

### Sankey<N, L>  data `{ nodes: N[]; links?: L[] }`
- Input types: node `{ id?: number|string, label?, fixedValue?, … }`, link `{ source: number|string|node, target: number|string|node, value, id?, color? }`. `linkValue` default `l => l.value` (must be positive numbers). Node `id` defaults to index.
- Layout: `nodeWidth?`, `nodeAlign?: SankeyNodeAlign (left|right|center|justify)`, `nodePadding?` (2), `nodeAdaptivePadding?`, `iterations?` (32), `nodeSort?`/`linkSort?` (`undefined` layout order, `null` input order, or fn), `nodeFixedValue?`, `heightNormalizationCoeff?` (1/16), `showSingleNode?`.
- Extend-size sizing only: `nodeHorizontalSpacing?` (150), `nodeMinHeight?` (20), `nodeMaxHeight?` (100). Component supports `Sizing.Extend`/`FitWidth` (`getWidth/getHeight`).
- Zoom: `enableZoom?` (true), `zoomExtent?` (`[1,5]`), `zoomMode?: SankeyZoomMode xy|x|y`, `zoomScale?`, `zoomPan?`, `disableZoomModifierKeys?`, `onZoom?(hScale, vScale, panX, panY, extent, event)`.
- Colors/style: `nodeColor?`, `nodePattern?`, `nodeIcon?`, `nodeIconColor?`, `nodeCursor?`, `linkColor?: StringAccessor<SankeyLink>` (`l => l.color`), `linkPattern?`, `linkCursor?`.
- Labels: `label?` (`n => n.label`), `subLabel?`, `labelPosition?` (auto|left|right), `labelVerticalAlign?`, `labelBackground?`, `labelFit?` (trim), `labelMaxWidth?` (70), `labelMaxWidthTakeAvailableSpace?`, `labelExpandTrimmedOnHover?` (true), `labelTrimMode?`, `labelFontSize?`, `labelTextSeparator?`, `labelForceWordBreak?` (true), `labelColor?`, `labelCursor?`, `labelVisibility?(d, bbox, hovered)`, `labelTextDecoration?`, `subLabelFontSize?`, `subLabelColor?`, `subLabelPlacement?: below|inline`, `subLabelToLabelInlineWidthRatio?` (0.4).
- Interaction: `highlightSubtreeOnHover?` (false), `highlightDuration?` (400), `highlightDelay?` (1000), `selectedNodeIds?: string[]`, `enterTransitionType?`/`exitTransitionType?` (default | from ancestor / to ancestor), `onLayoutCalculated?(nodes, links, depth, w, h, bleed)`.
- Selectors: `links`, `nodes`, `link`, `linkPath`, `linkSelectionHelper`, `labelGroup`, `label`, `sublabel`, `labelBackground`, `node`, `nodeIcon`, `nodeGroup`, `nodeSelectionRect`, `background`, `hidden`, `forceShow`, `labelTrimmed`. Default events: node mouseenter/leave (d, event); link mouseenter/leave.
- CSS: `--vis-sankey-link-color` (var(--vis-color-main-light)), `-link-opacity` (0.5), `-link-hover-opacity` (1.0), `-link-cursor`, `-node-color` (var(--vis-color-main)), `-node-opacity` (0.9), `-node-hover-opacity` (1.0), `-node-cursor`, `-node-label-color` (#575c65), `-node-label-font-size` (12px), `-node-label-font-weight` (600), `-node-label-text-decoration`, `-node-label-cursor`, `-node-label-background-fill-color` (#fff), `-node-label-background-stroke-color` (#eaeaea), `-node-label-background-opacity` (0.9), `-node-sublabel-font-size` (10px), `-node-sublabel-font-weight` (500), `-node-selection-stroke-width` (1.5px), `-node-selection-stroke-opacity` (0.6), `-node-selection-border-radius` (2px), `-icon-size`, `-icon-color` (#fff), `-icon-stroke-opacity`, `-icon-font-family`, + dark.
- Gotchas: **cycles are not allowed** (d3-sankey throws); links need valid `source`/`target` ids; `value` must be > 0. Needs d3-sankey (only dep).

### ChordDiagram<N, L>  data `{ nodes: N[]; links?: L[] }`
- Node `{ id?: string, … }`, link `{ source: number|string|node, target: ..., id?, value }`.
- Geometry: `angleRange?` (`[0,2π]`), `padAngle?` (0.02), `nodeWidth?` (15), `cornerRadius?` (2; constant or accessor), `radiusScaleExponent?` (2), `nodeLevels?: string[]` (hierarchy keys on node records, e.g. `['level1','level2']`).
- Style: `nodeColor?` (`d => d.color`), `nodePattern?`, `linkColor?` (default `var(--vis-chord-diagram-link-fill-color)`), `linkPattern?`, `linkValue?` (`l => l.value`).
- Labels: `nodeLabel?` (`d => d.label ?? d.key`), `nodeLabelColor?`, `nodeLabelAlignment?: ChordLabelAlignment along|perpendicular`.
- Controlled highlight: `highlightedNodeId?: number|string`, `highlightedLinkIds?: (number|string)[]` (overrides hover).
- Selectors: `background, nodes, links, labels, node, highlightedNode, label, labelText, labelExit, link, highlightedLink, transparent`. Default events mouseover/mouseout for node & ribbon.
- CSS: `--vis-chord-diagram-link-fill-color` (#cad5f6), `-link-stroke-color` (#777), `-link-opacity` (0.5), `-link-stroke-opacity` (0.15), `-link-highlighted-opacity` (0.9), `-link-dimmed-opacity` (0.25), `-node-highlighted-opacity` (0.9), `-node-dimmed-opacity` (0.25), `-label-text-fill-color-bright` (#fff), `-label-text-fill-color-dark` (#a5abb2), `-label-text-font-size` (1em), + dark.
- Gotcha: links expressed as flow between nodes; `d3-chord` required; `setSize` triggers recompute.

### Graph<N, L>  data `{ nodes: N[]; links?: L[] }` (type `GraphInputData`)
- Node `{ id?: number|string, x?, y?, label?, icon?, fill?, stroke?, group?, subgroup?, … }`, link `{ source: number|string|node, target: ..., id?, … }`. `x`/`y` only used with `layoutType: Precalculated`.
- Layout: `layoutType?: GraphLayoutType` = `force` (default) | `circular` | `concentric` | `parallel` | `parallel horizontal` | `dagre` | `elk` | `precalculated`; `layoutAutofit?` (true), `layoutAutofitTolerance?` (8), `layoutNonConnectedAside?`, `layoutNodeGroup?`, `layoutGroupOrder?`, `layoutParallel*` (NodesPerColumn 6, NodeSubGroup, SubGroupsPerRow 1, NodeSpacing, SubGroupSpacing 40, GroupSpacing, SortConnectionsByGroup), `forceLayoutSettings?` (`linkDistance` 60, `linkStrength` 0.45, `charge` -500, `forceXStrength` 0.15, `forceYStrength` 0.25, `numIterations`, `fixNodePositionAfterSimulation`), `dagreLayoutSettings?` (rankdir TB|BT|LR|RL, …), `layoutElkSettings?`, `layoutElkNodeGroups?`, `layoutElkGetNodeShape?`.
- View: `zoomScaleExtent?` (`[0.35,1.25]`), `disableZoom?`, `zoomEventFilter?`, `disableDrag?`, `disableBrush?`, `zoomThrottledUpdateNodeThreshold?` (100), `fitViewPadding?` (50), `fitViewAlign?: GraphFitViewAlignment`.
- Links: `linkWidth?` (1), `linkStyle?: solid|dashed`, `linkBandWidth?`, `linkArrow?: single|double|boolean`, `linkStroke?`, `linkDisabled?`, `linkFlow?`, `linkFlowAnimDuration?` (20000), `linkFlowParticleSize?` (2), `linkFlowParticleSpeed?`, `linkLabel?`, `linkLabelShiftFromCenter?`, `linkNeighborSpacing?` (8), `linkCurvature?` (0), `linkHighlightOnHover?` (true), `linkSource/TargetPointOffset?`, `selectedLinkId?`.
- Nodes: `nodeSize?` (30), `nodeStrokeWidth?` (3), `nodeShape?: circle|square|hexagon|triangle`, `nodeFill?` (`n => n.fill`), `nodeStroke?` (`n => n.stroke`), `nodeIcon?`, `nodeIconSize?`, `nodeLabel?` (`n => n.label`), label trim/wrap options (`nodeLabelTrim`, `…TrimMode`, `…TrimLength` 15, `…FitMode`, `…Width`, `…Separator`, `…ForceWordBreak`) and parallel `nodeSubLabel*`, `nodeSideLabels?`, `nodeBottomIcon?`, `nodeDisabled?`, `nodeGaugeValue?` (0..100), `nodeGaugeFill?`, `nodeGaugeAnimDuration?` (1500), `nodeSort?`, `nodeEnterPosition/Scale?`, `nodeExitPosition/Scale?`, custom render hooks (`nodeEnterCustomRenderFunction`, `nodeUpdate…`, `nodePartialUpdate…`, `nodeExit…`, `nodeOnZoom…`), `nodeSelectionHighlightMode?: none|greyout|greyout-non-connected`, `selectedNodeId?`, `selectedNodeIds?`.
- `panels?: GraphPanelConfig[]` (`nodes`, `label`, `fillColor`, `borderColor`, `padding`, `dashedOutline`, side icon fields).
- Callbacks: `onNodeDragStart/onNodeDrag/onNodeDragEnd`, `onNodeSelectionBrush`, `onNodeSelectionDrag`, `onZoom/onZoomStart/onZoomEnd`, `onLayoutCalculated(nodes, links)`, `onRenderComplete(...)`, `shouldDataUpdate(prev, next, datamodel)` (default deep `isEqual`; avoid re-layout on equal data).
- Selectors: `root, graphGroup, background, node, nodeShape, nodeGauge, nodeSideLabel, nodeLabel, dimmedNode, link, linkLine, linkLabel, dimmedLink, panel, panelRect, panelSelection, panelLabel, panelLabelText, panelSideIcon, panelSideIconShape, panelSideIconSymbol`, plus `Graph.nodeSelectors`. Default events: background click; node click/mouseover/mouseout; link click/mouseover/mouseout.
- CSS (light defaults): `--vis-graph-node-fill-color` (#fff), `-node-stroke-color` (rgb(206,211,222)), `-node-label-text-color` (#0F1E57), `-node-label-font-size` (9pt), `-node-label-background` (#fff), `-node-sublabel-text-color` (#989aa3), `-node-sublabel-font-size` (8pt), `-node-icon-fill-color` (#9ea7b8), `-node-icon-fill-color-bright` (#fff), `-node-gauge-color` (#adb4c2), `-node-selection-color` (#acb3b8), `-node-greyout-opacity` (0.9), `-node-greyout-color` (#ebeff7), `-node-icon-greyout-color`, `-node-greyout-filter`, `-node-bottom-icon-*`, `-node-side-label-*`, `-node-dominant-baseline`, `--vis-graph-link-stroke-color` (#e6e9f3), `-link-stroke-opacity` (1), `-link-greyout-opacity` (0.3), `-link-dashed-stroke-dasharray` (6 6), `-link-label-font-size` (9pt), `-link-label-background` (#e6e9f3), `-link-label-text-color-bright` (#fff), `-link-band-opacity` (0.35), `-link-support-stroke-width` (10px), `-link-flow-opacity`, `--vis-graph-brushed-node-stroke-color/label-text-color/icon-fill-color` (var(--vis-color-main)), `--vis-graph-panel-border-color` (#E6E9F3), `-panel-border-opacity`, `-panel-fill-color` (#fff), `-panel-label-color` (#6c778c), `-panel-label-background`, `-panel-label-font-size` (10pt), `-panel-label-font-weight` (300), `-panel-label-font-family`, `-panel-dashed-outline-color`, `-panel-side-icon-symbol-color`, `-panel-side-icon-shape-fill-color`, `--vis-graph-icon-font-family` (default `FontAwesome`; icons are font glyph characters, not SVG), `--vis-graph-brush-selection-opacity` (0.2), + `--vis-dark-graph-*`.
- Gotchas: layouts are **lazy-loaded via dynamic `import()`**: Force → `d3-force`; Dagre → `@unovis/graphlibrary` + `@unovis/dagre-layout`; Elk → `elkjs/lib/elk.bundled.js` (~1.6 MB). Layout is async; first render is empty until it resolves. Icons need an icon font (FontAwesome) loaded globally and `--vis-graph-icon-font-family` set (we need to set it to our icon font or avoid `nodeIcon`). Node/link types are augmented with internal fields (`_id`, `_state`, …); with `Precalculated` layout your own node `x`/`y` are used. Pass stable references and use `shouldDataUpdate` to skip re-layout.

### TopoJSONMap<AreaDatum, PointDatum, LinkDatum>  data `{ areas?: AreaDatum[]; points?: PointDatum[]; links?: LinkDatum[] }`
- Constructor: `new TopoJSONMap(config?, data?)`.
- **Map geometry is NOT in the component.** Config `topojson?: TopoJSON.Topology` (default undefined → no features) and `mapFeatureName?` (default `'countries'`) must be supplied. Bundled data is in the separate entry `@unovis/ts/maps` (not in the main barrel, not tree-shaken into charts): `WorldMapTopoJSON` (feature `countries`, 263 KB js), `WorldMap110mAlphaTopoJSON` (627 KB), `WorldMapSimplestTopoJSON` (106 KB), `USATopoJSON` (`states`, 40 KB), `USCountiesTopoJSON` (`counties`, 705 KB), `GermanyTopoJSON`/`UKTopoJSON`/`FranceTopoJSON`/`IndiaTopoJSON` (`regions`; India 617 KB), `ChinaTopoJSON` (`provinces`, 312 KB). Each feature has `{ name, color }` properties. Use `mapFeatureName` to match (`'countries' | 'states' | 'counties' | 'regions' | 'provinces'`). Custom maps = any TopoJSON topology; `topojson-client` is used internally. (Chinese map: `ChinaTopoJSON`, feature `provinces`.)
- Projection: `projection?: GeoProjection` (default `MapProjection.Kavrayskiy7()`; helper namespace `MapProjection` with Mercator, Equirectangular, EqualEarth, AlbersUsa, NaturalEarth1, Orthographic, … from `d3-geo` + `d3-geo-projection`). `AlbersUsa` for US maps.
- Areas: `areaId?` (`d => d.id ?? ''`, matches feature id from TopoJSON), `areaColor?` (`d => d.color ?? null`), `areaCursor?`, `areaLabel?`.
- Points: `longitude?`/`latitude?` (`d.longitude`/`d.latitude`), `pointId?`, `pointColor?`, `pointRadius?` (8), `pointStrokeWidth?`, `pointShape?: square|circle|triangle|ring`, `pointRingWidth?` (2), `pointCursor?`, `pointLabel?`, `pointLabelColor?`, `pointBottomLabel?`, `pointLabelTextBrightnessRatio?` (0.65), `colorMap?` (per-key pie/donut slices on a point: `{ healthy: {color}, … }`).
- Clustering: `clustering?` (false), `clusteringDistance?` (55), `clusterColor?`, `clusterRadius?`, `clusterLabel?`, `clusterLabelColor?`, `clusterBottomLabel?`, `clusterRingWidth?` (2), `clusterBackground?` (true), `clusterExpandOnClick?` (true). Uses `supercluster`.
- `heatmapMode?` (false), `heatmapModeBlurStdDeviation?` (10), `heatmapModeZoomLevelThreshold?` (2.5).
- Links/flows: `linkSource/linkTarget/linkId/linkWidth/linkColor/linkCursor`, `sourceLongitude/sourceLatitude/targetLongitude/targetLatitude`, `sourcePointRadius` (3), `sourcePointColor`, `enableFlowAnimation?` (false), `flowParticleColor/Radius (1.1)/Speed (0.07)/Density (0.6)`, `onSourcePointClick/MouseEnter/MouseLeave`.
- View: `zoomFactor?`, `zoomToLocation?: { coordinates: [lon, lat], zoomLevel, expandCluster? }`, `disableZoom?`, `zoomExtent?` (`[0.5, 6]`), `zoomDuration?` (400), `mapFitToPoints?`.
- Instance methods: `zoomIn(increment?)`, `zoomOut(increment?)`, `setZoom(level)`, `fitView()`, `selectPointById(id)`, `getSelectedPointId()`, `unselectPoint()`.
- Selectors: `root, features, feature, areaLabel, background, points, point, pointShape, pointLabel, pointBottomLabel, pointDonut, clusterDonut, clusterBackground, clusterBackgroundCircle, pointSelectionRing, pointSelection, links, link, flowParticles, flowParticle, sourcePoints, sourcePoint, pointPathRing`.
- CSS: `--vis-map-feature-color` (#dce3eb), `--vis-map-boundary-color` (#fff), `--vis-map-area-label-text-color` (#5b5f6d), `-area-label-font-size` (12px), `-area-label-font-weight` (600), `-area-label-font-family`, `-point-label-text-color-dark` (#5b5f6d), `-point-label-text-color-light` (#fff), `-point-label-font-size` (12px), `-point-label-font-weight` (600), `-point-label-font-family`, `-point-bottom-label-text-color`, `-point-bottom-label-font-size` (10px), `-point-bottom-label-font-weight`, `-point-default-fill-color` (#B9BEC3), `-point-default-stroke-color` (#959da3), `-point-default-stroke-width` (0px), `-point-ring-fill-color` (#fff), `-cluster-default-fill-color` (#fff), `-cluster-default-stroke-color` (#B9BEC3), `-cluster-default-stroke-width` (1.5px), `-cluster-donut-fill-color` (#959da3), `-cluster-expanded-background-fill-color` (#fff), + dark.
- Gotchas: the TopoJSON must be passed by us (import from `@unovis/ts/maps`, or lazy `import('@unovis/ts/maps')` to avoid shipping up to ~2.5 MB of JSON); area color: with `areaColor` default `d => d.color`, `areaId` must equal the TopoJSON feature `id` (e.g. ISO alpha-3 for world countries, FIPS state code for US); the bundled maps' features carry their own `color` property, not used unless data's `d.color`. LeafletMap/LeafletFlowMap are separate (need leaflet + maplibre-gl + tiles, both dynamically imported); not covered here.

### Heatmap<Datum>  data `Datum[]` (flat array filled into a grid; component is single-container, not XY)
- `value: NumericAccessor` (required; null/undefined → empty cell).
- Grid: `numRows?` (7), `numColumns?` (derived), `layout?: HeatmapLayoutType column|row` (column: fills top-to-bottom first, GitHub-calendar style), `offset?` (empty leading cells), `cellSize?: number | [w,h]` (unset → stretch to container; set with `Sizing.Extend`/`FitWidth` → component reports its size), `cellPadding?` (2), `cellCornerRadius?: number|boolean` (2), `cursor?`.
- Color: `color?: ColorAccessor<Datum>` (per-cell override), `colorRange?: string[]` (quantized buckets; default 4 greens via vars), `colorDomain?: [min,max]` (default data extent).
- Labels: `columnLabel?(columnIndex) => string|undefined`, `rowLabel?(rowIndex)`, `labelHideOverlapping?` (true).
- Selectors: `cell`, `cellEmpty`, `label`, `columnLabel`, `rowLabel`, `defaultColorRange`.
- CSS: `--vis-heatmap-color-1..4` (#9be9a8 #40c463 #30a14e #216e39, dark: #0e4429 #006d32 #26a641 #39d353), `--vis-heatmap-cell-fill-color` (#ebedf0 empty cell; dark #161b22), `-cell-stroke-color` (transparent), `-cell-stroke-width` (0px), `-cell-cursor`, `-label-color` (#6e7781; dark #7d8590), `-label-font-size` (12px), `-label-font-family`, `-label-font-weight` (400).
- Gotchas: **data is 1-D, not {x, y, value} matrix**: build the linear array row/column-major yourself (+ `offset`, `numRows`/`numColumns`); no built-in tooltip via config (use `Tooltip` triggers on `Heatmap.selectors.cell`; datum in events = `HeatmapCellDatum { datum, index, row, column, value, x, y, width, height }`); the `colorRange` is quantized (discrete steps), not continuous.

---
## 4. Legends, tooltip (standalone DOM components, not SVG; not containers)

### Tooltip  (`new Tooltip(config?)`; pass to container `tooltip`, or to Crosshair)
- `triggers?: { [selector]: (datum, i, els) => string | HTMLElement | null | undefined | void }` — e.g. `{ [Donut.selectors.segment]: d => … }`. Return `HTMLElement` for framework-rendered content (we render Vue into one element and return it).
- `components?: ComponentCore[]` (set automatically by the container), `container?: HTMLElement` (default: container host element; use `document.body` for escaping overflow, then `isContainerBody()`), `followCursor?` (true), `allowHover?` (false), `horizontalPlacement?` (`Position.Auto`; left|right|center|auto), `horizontalShift?` (0, only left/right), `verticalPlacement?` (`Position.Top`; top|bottom|center), `verticalShift?` (0), `className?`, `attributes?`, `hideDelay?`, `showDelay?`.
- Methods: `setConfig`, `setContainer`, `show(html, {x,y})`, `hide()`, `display()`, `place({x,y})`, `placeByElement(el)`, `render(html)`, `update()`, `destroy()`, `overrideHorizontalPlacement(pos)`.
- CSS: `--vis-tooltip-background-color` (rgba(255,255,255,.95)), `-border-color` (#e5e9f7), `-text-color` (#000), `-shadow-color`, `-box-shadow` (none), `-backdrop-filter` (none), `-padding` (10px 15px), `-border-radius` (5px), `-transition-duration` (300ms), + `--vis-dark-tooltip-*`.
- Gotcha: creating the container hosting DOM is lazy; one `Tooltip` instance per container (container destroy also destroys it).

### BulletLegend  (`new BulletLegend(el: HTMLElement, config?)`)
- Standalone: own host element, no container. API: `setConfig(cfg)`, `render()`, `destroy()` (`update` deprecated).
- `items: BulletLegendItemInterface[]` = `{ name: string|number, color?: string|string[], shape?: BulletShape (line|circle|cross|diamond|square|star|triangle|wye), inactive?, hidden?, pointer?, colorKey?, className?, pattern? }`, `orientation?: BulletLegendOrientation horizontal|vertical`, `onLegendItemClick?(item, i)`, `bulletShape?`, `bulletSize?: string|null` (CSS), `bulletSpacing?` (4), `labelClassName?`, `labelFontSize?: string|null`, `labelMaxWidth?: string|null`, `renderIntoProvidedDomNode?` (false), `colorFunction?`.
- Selectors: `item`, `itemVertical`, `clickable`, `label`, `bullet`.
- CSS: `--vis-legend-label-color` (#6c778c), `--vis-legend-label-max-width` (300px), `--vis-legend-label-font-size` (12px), `--vis-legend-bullet-size` (9px; 14px with patterns), `--vis-legend-bullet-inactive-opacity` (0.15), `--vis-legend-item-spacing` (20px), `--vis-legend-vertical-item-spacing` (5px), `--vis-legend-bullet-label-spacing` (8px), `--vis-dark-legend-label-color`.

### FlowLegend  (`new FlowLegend(el, config?)`)
- For Sankey/flow stage names. `items?: string[]`, `spacing?`, `customWidth?`, `margin?`, `lineColor?`, `labelColor?`, `labelFontSize?` (12), `arrowSymbol?` (`'▶'`), `arrowColor?`, `arrowSymbolYOffset?`, `onLegendItemClick?(label, i)`, `renderIntoProvidedDomNode?`.
- Selectors `labels, item, clickable, label, arrow`. CSS: `--vis-flow-legend-label-background` (#fff), `-label-color` (#71788a), `-link-color` (#E5E9F7), `-arrow-color` (#E5E9F7), `-label-padding` (5px 10px), `-arrow-padding` (0 5px), + dark.

### RollingPinLegend  (`new RollingPinLegend(el, config?)`)
- Gradient bar: `rects: string[]` (colors, required), `leftLabelText?`, `rightLabelText?`, `labelClassName?`, `labelFontSize?: string|null`, `renderIntoProvidedDomNode?`. Methods `setConfig`, `render`, `destroy`.
- Selectors `rectsContainer, label, leftLabel, rightLabel, rect`. CSS: `--vis-rolling-pin-legend-label-color` (#6c778c), `-label-max-width` (300px), `-label-font-size` (12px), `-spacing` (4px), `-item-width` (8px).

---
## 5. Bundle-size hints
- `@unovis/ts` is ESM, `sideEffects: ["styles/index.js", …]` → barrel imports tree-shake; `styles/index.js` (global emotion CSS injection of `:root` vars, patterns) is always pulled in with any container.
- Heavy, per component:
  - Sankey: `d3-sankey` (small, ~10 KB). 
  - ChordDiagram: `d3-chord` (small).
  - TopoJSONMap: `d3-geo`, `d3-geo-projection` (sizeable; all 40+ projections referenced by `MapProjection`), `topojson-client`, `supercluster`. Map data separate in `@unovis/ts/maps` (40 KB–705 KB per map in raw JS).
  - Graph: core is moderate; layouts are **dynamic imports**: force → `d3-force`, dagre → `@unovis/graphlibrary` + `@unovis/dagre-layout`, elk → `elkjs/lib/elk.bundled.js` (1.6 MB raw; only loaded for `GraphLayoutType.Elk`).
  - LeafletMap / LeafletFlowMap (not in scope): `leaflet` and `maplibre-gl` (~2.4 MB) are dynamic imports inside the component; barrel still lists them but unused ones tree-shake. `three` is listed in package.json but no wrapped component imports it.
  - Brush/FreeBrush: `d3-brush`. Treemap/NestedDonut: `d3-hierarchy`. Everything: `d3-selection/transition/scale/shape/array/zoom/drag/axis`, `@emotion/css`, `@juggle/resize-observer`.
- Our charts entry (`@vue-tsx-pro/ui/charts`) keeps Unovis as optional peer; keep new components in the same subpath, and ideally split graph/map into separate subpaths (e.g. `/charts/graph`, `/charts/map`) or lazy-load `@unovis/ts/maps`.

---
## 6. Existing wrapper patterns (packages/ui/src/charts)

Files: `XYChart.tsx` (shared implementation), `BarChart.tsx`, `LineChart.tsx`, `series.ts`, `index.ts`.
- Pattern: one `XYContainer` per chart; Unovis component instances are cached in a `Map` (`instance(key, create)`) and `setConfig` on every effect run; `container.update(config, undefined, rows)` thereafter (new `rows` array each effect so setData runs); `container.destroy()` on unmount **and** when the host element changes. **Bug risk**: after `destroy()` the cached instances are destroyed too (XYContainer.destroy destroys components, axes, crosshair, tooltip) but `instances`, `xAxis`, `yAxis`, `crosshair`, `tooltipBox` keep being reused if the element changes → reuse of destroyed instances. New wrappers should recreate instances whenever the container is recreated.
- Colors: series colors are CSS variables `colors.chart1..8` via `series.ts` (`resolveSeries`), passed as `color: (row|rows, i) => series[i].color` (Bar: per-datum accessor `(row, seriesIndex)`; Line: `(rows[], seriesIndex)`). Brightness-dependent Unovis features would need exact `var(--x)` strings (our stylex tokens expand to `var(--hash)` — OK, but cached by name).
- Axis: category axis with `tickValues = rows.map((_, i) => i)` + `tickFormat` → label; value axis `numTicks: 5`, `gridLine`, `tickLine:false`, `domainLine:false`, `tickPadding: 8`; `x` accessor returns row position, not the category value.
- Tooltip/Crosshair: Vue `render()` into a detached element returned from `crosshair.template`; `getCircles: () => []` for bar charts; `hideWhenFarFromPointer:false`; `crosshair-line-stroke-opacity: 0` for bars.
- Animation: container `duration` = theme `durations.lg` (0 for reduced motion) via `themeTransition()`.
- Accessibility: `ariaLabel: null`, svg host `aria-hidden`, hidden `<table>` for readers.
- Unique `filter#saturate` id fix per chart (`uniqueHighlightFilter`) + `--highlight-filter-id`.
- Domain: `valueDomain` → `yDomain`/`xDomain` depending on `horizontal`; min defaults to `Math.min(0, …values)`.
- CSS variables already mapped (on `xyChartStyles.root`): `--vis-font-family`, `--vis-axis-tick-label-font-size`, `--vis-axis-tick-label-color`, `--vis-axis-label-color`, `--vis-axis-grid-color`, `--vis-axis-domain-color`, `--vis-axis-tick-color`, `--vis-crosshair-line-stroke-color`, `--vis-crosshair-circle-stroke-color`, `--vis-tooltip-background-color`, `--vis-tooltip-border-color`, `--vis-tooltip-text-color`, `--vis-tooltip-border-radius`, `--vis-tooltip-box-shadow`, `--vis-tooltip-padding`, `--vis-tooltip-backdrop-filter`, `--vis-tooltip-transition-duration`, `--vis-grouped-bar-hover-stroke-width`; bar-only `--vis-crosshair-line-stroke-opacity: 0`.
- Own legend (HTML buttons) instead of Unovis `BulletLegend`; hidden series are removed from the data passed to components (not just dimmed).
- Theme tokens available: `colors.{background,surface,surfaceMuted,surfaceRaised,text,textMuted,border,borderMuted,borderStrong,accent*,danger*,success*,warning*,info*,inverseSurface,inverseText,focusRing,overlay,selection,highlight,chart1..chart8}`, `fonts`, `fontSizes`, `fontWeights`, `space`, `radii`, `borderWidths`, `shadows`, `durations`, `opacities`.

---
## 7. Theme mappings that can be reused / should be added (--vis-* → our tokens)

Already defined in `xyChartStyles.root` and reusable verbatim for every new chart (hoist into a shared `chartThemeVars` object):
- Global: `--vis-font-family: fonts.sans`.
- Axis/crosshair/tooltip block listed in section 6 (Axis, Crosshair, Tooltip, GroupedBar hover).
New, same-token candidates:
- Palette: `--vis-color0..5` → `colors.chart1..6` (and `--vis-color-main` → `colors.chart1`; `--vis-color-main-light`/`-dark` → `color-mix`-free variants, or `colors.accentSoft`/`colors.accent`) so any component defaulting to the Unovis palette (Donut segments without `color`, Sankey nodes, Graph) follows the theme. Only 6 default colors; prefer explicit `color` accessors using `colors.chart1..8`. `--vis-dark-color*`/dark selectors: ours does not use `data-theme="dark"` unless our theme sets it; set `--vis-colorN` directly (no need for `--vis-dark-*`).
- Labels (all ~12px #5b5f6d family): `--vis-donut-central-label-text-color`, `--vis-donut-central-sub-label-text-color`, `--vis-nested-donut-central-label-text-color`, `--vis-nested-donut-central-sublabel-text-color`, `--vis-radial-bar-central-label-text-color`, `--vis-radial-bar-central-sub-label-text-color`, `--vis-map-area-label-text-color`, `--vis-map-point-bottom-label-text-color`, `--vis-timeline-label-color`, `--vis-annotations-text-color`, `--vis-legend-label-color`, `--vis-rolling-pin-legend-label-color`, `--vis-flow-legend-label-color`, `--vis-sankey-node-label-color`, `--vis-graph-node-label-text-color`, `--vis-graph-panel-label-color`, `--vis-heatmap-label-color`, `--vis-plotline-label-color`, `--vis-plotband-label-color` → `colors.textMuted` (or `colors.text` for central labels). Matching `-font-size` vars → `fontSizes.xs/sm`; central label sizes (16/24px) → `fontSizes.lg/xl`; `-font-weight` → `fontWeights.semibold/medium`.
- Tracks/backgrounds: `--vis-donut-background-color`, `--vis-nested-donut-background-color`, `--vis-radial-bar-background-color` (#E7E9F3) → `colors.surfaceMuted` (or `colors.fill`); `--vis-timeline-row-even-fill-color` → `colors.surface`, `--vis-timeline-row-odd-fill-color` → `colors.surfaceMuted`; `--vis-timeline-scrollbar-background-color` → `colors.surfaceMuted`, `--vis-timeline-scrollbar-color` → `colors.borderStrong`; `--vis-heatmap-cell-fill-color` → `colors.fill`; `--vis-sankey-node-label-background-fill-color`/`--vis-graph-node-label-background`/`--vis-graph-panel-fill-color`/`--vis-graph-panel-label-background`/`--vis-flow-legend-label-background`/`--vis-map-point-ring-fill-color`/`--vis-map-cluster-default-fill-color` → `colors.surface`; `--vis-sankey-node-label-background-stroke-color`, `--vis-graph-panel-border-color`, `--vis-flow-legend-link-color`, `--vis-flow-legend-arrow-color` → `colors.border`/`borderMuted`.
- Strokes/separators: `--vis-treemap-tile-stroke-color`, `--vis-treemap-tile-hover-stroke-color`, `--vis-nested-donut-segment-stroke-color` (= donut background), `--vis-donut-segment-stroke-width`, `--vis-chord-diagram-link-stroke-color`, `--vis-map-boundary-color` → `colors.surface` (+ `borderWidths.*` for widths); `--vis-brush-unselected-fill-color` → `colors.overlay` (or `colors.text` with `--vis-brush-unselected-opacity`), `--vis-brush-handle-fill-color` → `colors.borderStrong`, `--vis-brush-handle-stroke-color` → `colors.surface`, `--vis-free-brush-selection-fill-color` → `colors.accent` with `-selection-fill-opacity` ~0.15, `-selection-stroke-color` → `colors.accentBorder`, `-handle-fill-color` → `colors.accent`.
- Reference lines/bands (semantic): `--vis-plotline-color` → `colors.danger` (or `colors.warning`), `--vis-plotband-color` → `colors.warningSoft`/`colors.accentSoft`, `--vis-plotline-width` → `borderWidths.md` (unitless number in Unovis; check), `--vis-plotline-label-*` → text tokens.
- Maps: `--vis-map-feature-color` → `colors.fill` (or `surfaceMuted`), `--vis-map-boundary-color` → `colors.surface`, `--vis-map-point-default-fill-color` → `colors.textMuted`, `--vis-map-cluster-donut-fill-color` → `colors.textMuted`.
- Graph: `--vis-graph-node-fill-color` → `colors.surface`, `--vis-graph-node-stroke-color` → `colors.border`, `--vis-graph-link-stroke-color` → `colors.borderStrong`, `--vis-graph-node-label-text-color` → `colors.text`, `--vis-graph-node-sublabel-text-color` → `colors.textMuted`, `--vis-graph-node-selection-color`/`--vis-graph-brushed-node-*` → `colors.accent`, greyout colors → `colors.surfaceMuted`/`textDisabled`, `--vis-graph-link-label-background` → `colors.fill`.
- Sankey/Chord: `--vis-sankey-node-color` → `colors.chart1`, `--vis-sankey-link-color` → `colors.chart1` with `--vis-sankey-link-opacity` ~0.35; `--vis-chord-diagram-link-fill-color` → `colors.surfaceMuted`/`fill`.
- Legends (if we ever use Unovis legends instead of ours): `--vis-legend-label-color` → `colors.textMuted`, `--vis-legend-label-font-size` → `fontSizes.xs`, spacing vars → `space.*`.
- Opacities (dimming): `--vis-legend-bullet-inactive-opacity`, `--vis-chord-diagram-*-dimmed-opacity`, `--vis-graph-*-greyout-opacity` → `opacities.*` tokens (check names in `opacities`).
- Heatmap steps: `--vis-heatmap-color-1..4` → 4 steps of one hue from the theme (e.g. `colors.accentSoft`, `accentSoftHover`, `accentBorder`/mix, `accent`) — define a dedicated sequential-scale token group if absent (no sequential tokens exist today besides `chart1..8`).
- Tooltip: reuse the same Unovis `Tooltip` styling vars as XYChart; for Single-container charts, tooltips use `triggers` with a Vue-rendered element (same `tooltipContent()` used for crosshair).
- Dark theme: Unovis dark overrides keyed by `html[data-theme="dark"]` / `.dark-theme` / `.theme-dark`; because we map every var to a token that already switches by theme, no `--vis-dark-*` handling is needed unless our theme root sets `data-theme="dark"` (then those dark selectors would apply `--vis-dark-*` values over ours → set both or ensure our assignments are on a more specific element: ours are on the chart root element, so they win over `:root` rules; the dark rule `html[data-theme="dark"] .<component-root>` targets the component's `.root` class for some vars, e.g. area stroke).
