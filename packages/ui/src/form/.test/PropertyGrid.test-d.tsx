// 类型：字段里用了使用方的种类（X）时，editors 要给每一种编辑器，render 拿到的 type 是那一种；
// 没有自己的种类时不用 editors，写了内置以外的种类报错
import { PropertyEditor, PropertyGrid } from '../PropertyGrid';
import type { PropertyField } from '../property-types';

type Asset = { readonly kind: 'asset'; readonly folder: string };
type Entity = { readonly kind: 'entity' };

declare const fields: PropertyField<Asset | Entity>[];
declare const plain: PropertyField[];
const onSet = () => {};

export const withEditors = (
  <PropertyGrid
    fields={fields}
    value={{}}
    onSet={onSet}
    editors={{
      asset: { render: ({ type }) => type.folder },
      entity: { render: () => null },
    }}
  />
);

export const missingEditor = (
  <PropertyGrid
    fields={fields}
    value={{}}
    onSet={onSet}
    // @ts-expect-error 少了 entity 的编辑器
    editors={{ asset: { render: () => null } }}
  />
);

export const builtinOnly = <PropertyGrid fields={plain} value={{}} onSet={onSet} />;

// @ts-expect-error 没有声明的种类不是内置的
export const unknownKind: PropertyField = { name: 'x', type: { kind: 'texture' } };

export const single = (
  <PropertyEditor type={{ kind: 'vector', size: 3 }} value={[0, 0, 0]} label="位置" onSet={onSet} />
);
