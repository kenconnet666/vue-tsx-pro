// 类型：SchemaForm 的 fields 只接受值里的字段路径，pick / omit 只接受顶层的键
import { z } from 'zod';
import { SchemaFields, SchemaForm } from '../SchemaForm';
import { emptyValues } from '../schema-fields';
import { useForm } from '../useForm';

const schema = z.object({ name: z.string(), address: z.object({ city: z.string() }) });
const form = useForm({ schema, initial: emptyValues(schema) });

export const ok = (
  <SchemaForm controller={form} pick={['name']} fields={{ 'address.city': () => null }} />
);
// @ts-expect-error 没有这个字段
export const typo = <SchemaForm controller={form} fields={{ nmae: () => null }} />;
// @ts-expect-error pick 只接受顶层的键
export const nested = <SchemaForm controller={form} pick={['address.city']} />;
// @ts-expect-error SchemaFields 的 omit 也只接受顶层的键
export const fieldsTypo = <SchemaFields controller={form} omit={['nmae']} />;
export const fields = <SchemaFields controller={form} omit={['address']} columns={2} />;
