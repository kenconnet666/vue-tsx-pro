// 灯光的属性：几种之一（点光、聚光、方向光，各有自己的字段）、线性颜色、有默认值的可选强度、写了才开的阴影、列表，
// 和使用方自己的种类（贴图：从一组贴图里选，editors 给编辑器）。每次修改用 setPropertyPath 落到值上，右边是当前的值
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  PropertyGrid,
  Select,
  setPropertyPath,
  type PropertyField,
} from '@zerodep-dev/vue-tsx-pro-ui';

/** 自己的种类：贴图 */
type Texture = { readonly kind: 'texture' };

const TEXTURES = ['cookies/window', 'cookies/leaves', 'cookies/grid'];

const fields: PropertyField<Texture>[] = [
  { name: 'enabled', label: '开着', type: { kind: 'bool' } },
  {
    name: 'shape',
    label: '种类',
    type: {
      kind: 'union',
      tag: 'type',
      common: [{ name: 'range', label: '范围', type: { kind: 'number', min: 0, unit: 'm' } }],
      variants: {
        point: [],
        spot: [
          {
            name: 'angle',
            label: '张角',
            type: { kind: 'number', min: 1, max: 179, step: 1, unit: '°' },
          },
          { name: 'cookie', label: '遮罩', type: { kind: 'texture' }, nullable: true },
        ],
        directional: [{ name: 'direction', label: '方向', type: { kind: 'vector', size: 3 } }],
      },
    },
  },
  { name: 'color', label: '颜色', type: { kind: 'color', space: 'linear' } },
  {
    name: 'intensity',
    label: '强度',
    description: '不写时是 1',
    type: { kind: 'number', min: 0, step: 0.1 },
    optional: true,
    default: 1,
  },
  {
    name: 'shadow',
    label: '阴影',
    description: '写了才投阴影',
    optional: true,
    type: {
      kind: 'object',
      fields: [
        {
          name: 'size',
          label: '图集大小',
          type: { kind: 'enum', values: ['512', '1024', '2048'] },
        },
        { name: 'bias', label: '偏移', type: { kind: 'number', step: 0.001 } },
      ],
    },
  },
  { name: 'layers', label: '照到的层', type: { kind: 'list', item: { kind: 'string' } } },
];

const styles = css.create({
  root: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(18rem, 1fr))',
    gap: '_lg',
  },
  value: {
    margin: 0,
    fontFamily: '_mono',
    fontSize: '_xs',
    color: '_textMuted',
    whiteSpace: 'pre-wrap',
  },
});

export default _component(() => {
  let light = _state<unknown>({
    enabled: true,
    shape: { type: 'spot', range: 8, angle: 45, cookie: null },
    color: [1, 0.8, 0.6],
    layers: ['default'],
  });
  return () => (
    <div {...css.attrs(styles.root)}>
      <PropertyGrid
        fields={fields}
        value={light}
        onSet={(path, value) => (light = setPropertyPath(light, path, value))}
        editors={{
          texture: {
            render: ({ value, label, set }) => (
              <Select
                size="sm"
                aria-label={label}
                items={TEXTURES.map((path) => ({ value: path, label: path }))}
                _value={typeof value === 'string' ? value : null}
                onUpdate:_value={(path: string | null) => path !== null && set([], path)}
              />
            ),
            empty: () => TEXTURES[0],
          },
        }}
      />
      <pre {...css.attrs(styles.value)}>{JSON.stringify(light, null, 2)}</pre>
    </div>
  );
});
