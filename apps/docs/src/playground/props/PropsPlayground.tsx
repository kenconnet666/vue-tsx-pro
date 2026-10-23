/**
 * 组件演练场的面板：选一个组件，点选右侧的控件组合各个属性，左侧即时看到效果与生成的代码。
 * 组件目录与控件都从类型生成（virtual:api-catalog）；复杂属性的固定值见 presets.tsx。
 * 预览直接渲染组件库里的组件（不经过编译）；代码可以复制，也可以带进代码演练场继续改。
 */
import { RotateCcw, X } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { breakpoints } from '@vue-tsx-pro/ui/tokens.stylex';
import * as ui from '@vue-tsx-pro/ui';
import * as effects from '@vue-tsx-pro/ui/effects';
import * as patterns from '@vue-tsx-pro/ui/patterns';
import * as workflow from '@vue-tsx-pro/ui/workflow';
import {
  Alert,
  Button,
  Code,
  CodeBlock,
  Combobox,
  Flex,
  IconButton,
  NumberField,
  Popover,
  Paragraph,
  Select,
  Small,
  Switch,
  TextField,
  ToggleGroup,
  ToggleItem,
} from '@vue-tsx-pro/ui';
import { type ApiProp } from '@vue-tsx-pro/ui/docs-kit';
import catalog from 'virtual:api-catalog';
import {
  h,
  onErrorCaptured,
  onMounted,
  onUpdated,
  watch,
  type Component,
  type VNodeChild,
} from 'vue';
import { EditInPlayground } from '../../site/EditInPlayground';
import { IconGallery, iconByName } from '../../site/IconGallery';
import { canvasStyles } from '../../site/canvas';
import { CATEGORY_LABELS } from '../../site/nav';
import { componentCode } from './code';
import { controlOf, parseDefault, type Control } from './controls';
import { HIDDEN, PRESETS, type Preset } from './presets';

const styles = stylex.create({
  layout: {
    display: 'grid',
    gap: '_xl',
    alignItems: 'start',
    gridTemplateColumns: {
      default: 'minmax(0, 1fr)',
      [breakpoints.md]: 'minmax(0, 1fr) 20rem',
    },
  },
  // 效果区：画布（canvasStyles）加边框
  canvas: {
    display: 'grid',
    placeItems: 'center',
    minHeight: '14rem',
    padding: '_xl',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_border',
    borderRadius: '_lg',
  },
  // 块级组件（网格、卡片、步骤条）占满画布宽度，行内组件（按钮、标记）居中：渲染后按根元素的 display 决定。
  // 画布本身是块级：放在 flex 里时子元素的 display 会被改成块级，就量不出来了
  stage: { width: '_full' },
  stageInline: { textAlign: 'center' },
  picker: { flexGrow: 1, minWidth: 0 },
  iconTrigger: { flexGrow: 1, justifyContent: 'flex-start' },
  iconPanel: { width: 'min(32rem, 85vw)' },
  label: { fontFamily: '_mono', fontSize: '_sm', fontWeight: '_medium' },
});

/** 演练场里的一个组件 */
/** 能在演练场里调的入口（图表、3D 这类重依赖的子路径不进）：导入路径 → 模块 */
const MODULES: Readonly<Record<string, Record<string, unknown>>> = {
  '@vue-tsx-pro/ui': ui,
  '@vue-tsx-pro/ui/patterns': patterns,
  '@vue-tsx-pro/ui/workflow': workflow,
  '@vue-tsx-pro/ui/effects': effects,
};

interface Entry {
  name: string;
  /** 从哪个入口导入 */
  entry: string;
  category: string;
  description: string;
  props: readonly ApiProp[];
  preset: Preset;
}

/** 内容是普通文字的组件：面板里有一个“内容”输入框 */
const textChildren = (entry: Entry) =>
  typeof entry.preset.children === 'string'
    ? entry.preset.children
    : entry.preset.children === undefined &&
        entry.props.some((prop) => prop.name === 'children' && prop.type === 'VNodeChild')
      ? entry.name
      : undefined;

/** 必填项都有办法给出（控件、预设）的组件才能放进演练场 */
function isPlayable(entry: Entry): boolean {
  const { initial = {}, fixed = {}, children } = entry.preset;
  return entry.props.every(
    (prop) =>
      !prop.required ||
      prop.name in initial ||
      prop.name in fixed ||
      (prop.name === 'children'
        ? children !== undefined || textChildren(entry) !== undefined
        : controlOf(prop) !== undefined),
  );
}

const entries: Entry[] = catalog
  .filter((item) => !HIDDEN.has(item.name) && item.entry in MODULES)
  .map((item) => ({
    name: item.name,
    entry: item.entry,
    category: item.category,
    description: item.api.description,
    props: item.api.props,
    preset: PRESETS[item.name] ?? {},
  }))
  .filter(isPlayable);

/** 组件选择框的选项：按分类分组 */
const pickerItems = entries.map((entry) => ({
  value: entry.name,
  label: entry.name,
  group: CATEGORY_LABELS[entry.category] ?? entry.category,
}));

/** 组件演练场能调的组件名 */
export const playableNames: ReadonlySet<string> = new Set(entries.map((entry) => entry.name));

/** 预览出错时显示错误，不让整个面板崩掉；换组件时按 key 重建 */
const PreviewBoundary = _component(({ children }: { children?: VNodeChild }) => {
  let error = _state.raw<Error | null>(null);
  onErrorCaptured((caught) => {
    error = caught instanceof Error ? caught : new Error(String(caught));
    return false;
  });
  return () =>
    error ? (
      <Alert tone="danger" title="预览出错">
        {error.message}
      </Alert>
    ) : (
      children
    );
});

/** 展开成受控的绑定：值与 onUpdate 回调（values 的类型是 unknown，不能直接 _bind） */
const model = (key: string, value: unknown, set: (next: unknown) => void) => ({
  [key]: value,
  [`onUpdate:${key}`]: set,
});

export interface PropsPlaygroundProps {
  /** 当前的组件名：父级可以写 component={_bind(x)} */
  component?: string;
}

export const PropsPlayground = _component(
  ({ component = _bindable('Button') }: PropsPlaygroundProps) => {
    let values = _state<Record<string, unknown>>({});
    // 正打开图标库的属性名：同一时间只开一个
    let iconPicking = _state<string | null>(null);

    const entry = _derived(
      entries.find((item) => item.name === component) ??
        entries.find((item) => item.name === 'Button')!,
    );
    const controls = _derived(
      entry.props.flatMap((prop) =>
        prop.name in (entry.preset.fixed ?? {}) ? [] : (controlOf(prop) ?? []),
      ),
    );
    const defaults = _derived(
      Object.fromEntries(entry.props.map((prop) => [prop.name, parseDefault(prop.default)])),
    );
    const childrenText = _derived(textChildren(entry));

    function reset() {
      values = { ...defaults, ...entry.preset.initial, children: childrenText };
    }
    watch(() => entry.name, reset, { immediate: true });

    let stage = _state.raw<HTMLElement | null>(null);
    let inline = _state(true);
    function measure() {
      const root = stage?.firstElementChild;
      const next = !root || getComputedStyle(root).display.startsWith('inline');
      if (next !== inline) inline = next;
    }
    onMounted(measure);
    onUpdated(measure);

    function set(name: string) {
      return (next: unknown) => (values[name] = next === '' || next === null ? undefined : next);
    }

    function renderControl(control: Control): VNodeChild {
      const { name, values: options = [] } = control.prop;
      const value = values[name];
      switch (control.kind) {
        case 'enum':
          return control.options.length <= 6 ? (
            <ToggleGroup
              {...model('value', value, set(name))}
              size="sm"
              required={defaults[name] !== undefined}
              aria-label={name}
            >
              {control.options.map((option) => (
                <ToggleItem
                  key={option}
                  value={option}
                  title={options.find((item) => item.value === option)?.description}
                >
                  {option}
                </ToggleItem>
              ))}
            </ToggleGroup>
          ) : (
            <Select
              {...model('value', value, set(name))}
              items={control.options.map((option) => ({ value: option, label: option }))}
              size="sm"
              clearable={defaults[name] === undefined}
              aria-label={name}
            />
          );
        case 'boolean':
          return (
            <Switch {...model('checked', value === true, set(name))} size="sm" aria-label={name} />
          );
        case 'text':
          return (
            <TextField {...model('value', value ?? '', set(name))} size="sm" aria-label={name} />
          );
        case 'number':
          return (
            <NumberField
              {...model('value', value ?? null, set(name))}
              size="sm"
              aria-label={name}
            />
          );
        case 'icon': {
          // 图标控件的值总是导入名
          const picked = typeof value === 'string' ? value : undefined;
          return (
            <Flex gap="xs" align="center">
              <Popover
                {...model(
                  'open',
                  iconPicking === name,
                  (open) => (iconPicking = open ? name : null),
                )}
                placement="bottom-end"
                trigger={(props) => (
                  <Button
                    {...props}
                    variant="surface"
                    tone="neutral"
                    size="sm"
                    icon={picked ? iconByName(picked) : undefined}
                    sx={styles.iconTrigger}
                  >
                    {picked ?? '选择图标'}
                  </Button>
                )}
              >
                <div {...stylex.attrs(styles.iconPanel)}>
                  <IconGallery
                    value={picked ?? ''}
                    onPick={(picked) => {
                      set(name)(picked);
                      iconPicking = null;
                    }}
                  />
                </div>
              </Popover>
              {picked && (
                <IconButton
                  icon={X}
                  size="sm"
                  aria-label={`清除 ${name}`}
                  onClick={() => set(name)(undefined)}
                />
              )}
            </Flex>
          );
        }
      }
    }

    function renderPreview(): VNodeChild {
      const target = MODULES[entry.entry]![entry.name] as Component;
      const props: Record<string, unknown> = {};
      for (const [name, item] of Object.entries(entry.preset.fixed ?? {})) props[name] = item.value;
      for (const prop of entry.props) {
        const value = values[prop.name];
        if (prop.name === 'children' || value === undefined) continue;
        const control = controls.find((item) => item.prop.name === prop.name);
        props[prop.name] = control?.kind === 'icon' ? iconByName(value as string) : value;
        if (prop.bindable) props[`onUpdate:${prop.name}`] = set(prop.name);
      }
      const { children } = entry.preset;
      const content =
        children !== undefined && typeof children !== 'string'
          ? children.render
          : childrenText !== undefined
            ? () => values.children as string
            : undefined;
      return h(target, props, content && { default: content });
    }

    function code(): string {
      const { fixed = {}, children, imports, icons } = entry.preset;
      return componentCode({
        name: entry.name,
        entry: entry.entry,
        controls,
        values,
        defaults,
        fixed: {
          ...Object.fromEntries(Object.entries(fixed).map(([name, item]) => [name, item.code])),
          // 预设给了初始值、又没有控件的属性（如 Stat 的 value）也要写进代码
          ...Object.fromEntries(
            Object.keys(entry.preset.initial ?? {})
              .filter((name) => !controls.some((control) => control.prop.name === name))
              .map((name) => [name, `{${JSON.stringify(values[name])}}`]),
          ),
        },
        children:
          children !== undefined && typeof children !== 'string'
            ? children.code
            : (values.children as string | undefined),
        imports,
        icons,
      });
    }

    return () => {
      const source = code();
      return (
        <Flex direction="column" gap="lg">
          <Flex gap="sm" align="center">
            <Combobox
              items={pickerItems}
              value={_bind(component)}
              placeholder="搜索组件"
              aria-label="组件"
              sx={styles.picker}
            />
            <Button variant="ghost" tone="neutral" icon={RotateCcw} onClick={reset}>
              重置
            </Button>
          </Flex>
          {entry.description && <Paragraph tone="muted">{entry.description}</Paragraph>}
          <div {...stylex.attrs(styles.layout)}>
            <Flex direction="column" gap="md">
              <div {...stylex.attrs(canvasStyles.canvas, styles.canvas)}>
                <div
                  ref={_toRef(stage)}
                  {...stylex.attrs(styles.stage, inline && styles.stageInline)}
                >
                  <PreviewBoundary key={entry.name}>{renderPreview()}</PreviewBoundary>
                </div>
              </div>
              <CodeBlock code={source} lang="tsx" title={`${entry.name}.tsx`} />
              <Flex justify="end">
                <EditInPlayground code={source} />
              </Flex>
            </Flex>
            <Flex direction="column" gap="md">
              {childrenText !== undefined && (
                <Flex direction="column" gap="xs">
                  <Small sx={styles.label}>children</Small>
                  <TextField
                    {...model('value', values.children ?? '', set('children'))}
                    size="sm"
                    aria-label="内容"
                  />
                </Flex>
              )}
              {controls.map((control) => (
                <Flex key={control.prop.name} direction="column" gap="xs">
                  <Small sx={styles.label} title={control.prop.description}>
                    {control.prop.name}
                  </Small>
                  {renderControl(control)}
                </Flex>
              ))}
              {controls.length === 0 && childrenText === undefined && (
                <Small tone="muted">
                  这个组件没有能直接调的属性；看它的文档页或在 <Code>代码演练场</Code> 里改。
                </Small>
              )}
            </Flex>
          </div>
        </Flex>
      );
    };
  },
);
