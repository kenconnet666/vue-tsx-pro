// 类型：FieldPath 列出值里的字段路径；form.Field 的 name 与 setError 只接受这些路径
import { useForm, type FieldPath } from '../useForm';

interface Values {
  email: string;
  birthday: Date;
  address?: { city: string };
  items: { name: string }[];
}

export const paths: FieldPath<Values>[] = [
  'email',
  'birthday',
  'address',
  'address.city',
  'items',
  'items.0',
  'items.0.name',
];
// @ts-expect-error Date 当作一个整体，不往里展开
export const intoDate: FieldPath<Values> = 'birthday.getTime';
// @ts-expect-error 没有这个字段
export const typo: FieldPath<Values> = 'emial';

const form = useForm<Values>({ initial: { email: '', birthday: new Date(), items: [] } });
form.setError('items.0.name', '重复');
// @ts-expect-error 没有这个字段
form.setError('address.street', '不存在');

export const field = <form.Field name="address.city" label="城市" />;
// @ts-expect-error 没有这个字段
export const wrongField = <form.Field name="city" label="城市" />;

// 数组字段：只接受值是数组的路径，项的类型跟着推出
export const names: string[] = form.array('items').items.map((item) => item.name);
// @ts-expect-error email 不是数组
form.array('email');
// 单字段校验：value 的类型是这个字段的类型
useForm<Values>({
  initial: { email: '', birthday: new Date(), items: [] },
  fields: {
    email: { validate: (email) => (email.endsWith('@x.com') ? undefined : '只能用公司邮箱') },
  },
});
