// 换一个触发字符：# 引用单据。prefix 两边要一致（输入框与显示）；没有匹配时列表里给一句提示；
// 字数、清空、外观同 Textarea。显示时用 renderMention 把引用做成链接
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Card,
  Field,
  Flex,
  Link,
  Mentions,
  MentionText,
  Small,
  type ListboxOption,
} from '@zerodep-dev/vue-tsx-pro-ui';

const orders: ListboxOption[] = [
  { value: 'PO-2024-0318', label: 'PO-2024-0318', description: '液压阀组 · 华辰精密' },
  { value: 'PO-2024-0325', label: 'PO-2024-0325', description: '密封件 · 恒通密封' },
  { value: 'QC-2024-0102', label: 'QC-2024-0102', description: '来料检验 · 不合格 3 件' },
  { value: 'RT-2024-0044', label: 'RT-2024-0044', description: '退货申请 · 待审批' },
];

export default _component(() => {
  let note = _state('#QC-2024-0102 的不合格品走退货，关联 ');
  let cited = _state<string[]>([]);
  return () => (
    <Card>
      <Flex direction="column" gap="md">
        <Field
          label="处理说明"
          description="输入 # 引用单据：按单号过滤，引用过的单据会挂在这条说明下面"
        >
          <Mentions
            _value={note}
            _mentions={cited}
            items={orders}
            prefix="#"
            empty="没有这个单号；只能引用近 30 天的单据"
            rows={3}
            maxlength={200}
            showCount
            clearable
            variant="soft"
          />
        </Field>
        <Flex direction="column" gap="xs">
          <Small tone="muted">显示出来（引用是链接）</Small>
          <MentionText
            text={note}
            options={orders}
            prefix="#"
            renderMention={(order, text) => (
              <Link href={`#${order.value}`} key={order.value}>
                {text}
              </Link>
            )}
          />
        </Flex>
        <Small tone="muted">引用了 {cited.length} 张单据</Small>
        <Field label="只读（已提交的说明）">
          <Mentions
            _value="#PO-2024-0318 已到货，按 #QC-2024-0102 复检"
            items={orders}
            prefix="#"
            readonly
          />
        </Field>
      </Flex>
    </Card>
  );
});
