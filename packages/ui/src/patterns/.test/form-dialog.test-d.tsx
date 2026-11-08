// useFormDialog 的结果类型：字段写成字面量时按名字给出类型，多选的是 string[]
import { expectTypeOf, it } from 'vitest';
import type { FormDialogField, FormDialogValues } from '../form-dialog';

it('多选字段是 string[]，其余是 string；字段不是字面量时每项都是 string', () => {
  const fields = [
    { name: 'reason', label: '原因', type: 'textarea' },
    { name: 'users', label: '抄送给', type: 'select', multiple: true },
  ] as const;
  expectTypeOf<FormDialogValues<typeof fields>>().toEqualTypeOf<{
    reason: string;
    users: string[];
  }>();
  expectTypeOf<FormDialogValues<FormDialogField[]>>().toEqualTypeOf<Record<string, string>>();
});
