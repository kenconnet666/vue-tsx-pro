// 远程建议：输入停下 300ms 后按输入取供应商名称，只采用最后一次；也可以填一个还不在系统里的新供应商
import { Building2 } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Autocomplete, Field, Flex, Small } from '@vue-tsx-pro/ui';

const suppliers = [
  '杭州远山精密机械有限公司',
  '杭州青禾研发中心有限公司',
  '宁波海川液压件有限公司',
  '苏州明德电子科技有限公司',
  '无锡恒通密封件有限公司',
  '上海星澜涂装工程有限公司',
  '成都锐川钣金制造有限公司',
];

// 假的接口：400ms 后返回包含输入的供应商（没输入时不给建议）；新的输入到来时经 signal 中止
const search = (text: string, signal: AbortSignal) =>
  new Promise<string[]>((resolve) => {
    if (!text) return resolve([]);
    const timer = setTimeout(() => resolve(suppliers.filter((name) => name.includes(text))), 400);
    signal.addEventListener('abort', () => clearTimeout(timer));
  });

export default _component(() => {
  let supplier = _state('');
  return () => (
    <Flex direction="column" gap="xs">
      <Field label="供应商" description="输入“杭州”“液压”试试；选不到时直接写全称，提交后会新建">
        <Autocomplete
          _value={supplier}
          load={search}
          icon={Building2}
          clearable
          placeholder="供应商全称"
        />
      </Field>
      <Small tone="muted" aria-live="polite">
        {supplier ? `将提交：${supplier}` : '还没有填'}
      </Small>
    </Flex>
  );
});
