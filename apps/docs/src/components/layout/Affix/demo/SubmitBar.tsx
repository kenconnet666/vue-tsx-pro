// 长表单底部的提交栏：offsetBottom 贴在滚动面板的底边，滚到表单末尾时回到原位；
// 还压着下面的内容时（data-stuck）有阴影，到底了阴影消失——看得出下面还有没有内容
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Affix,
  Button,
  Card,
  Field,
  Flex,
  ScrollArea,
  Small,
  Textarea,
  TextField,
} from '@zerodep-dev/vue-tsx-pro-ui';

const fields = [
  '供应商名称',
  '统一社会信用代码',
  '开户银行',
  '银行账号',
  '联系人',
  '联系电话',
  '收货地址',
  '发票抬头',
];

export default _component(() => {
  let stuck = _state(false);
  let panel = _state.raw<HTMLElement | null>(null);
  let saved = _state(false);
  return () => (
    <Card padding="none" style={{ overflow: 'hidden' }}>
      <ScrollArea
        style={{ height: '20rem' }}
        propsViewport={{ ref: (element: unknown) => (panel = element as HTMLElement | null) }}
      >
        <Flex direction="column" gap="md" style={{ padding: '0.75em' }}>
          {fields.map((label) => (
            <Field key={label} label={label}>
              <TextField />
            </Field>
          ))}
          <Field label="备注">
            <Textarea rows={3} />
          </Field>
          <Affix target={() => panel} offsetBottom={0} onChange={(next) => (stuck = next)}>
            <Card padding="sm">
              <Flex align="center" justify="between" gap="sm" wrap>
                <Small tone="muted" aria-live="polite">
                  {saved ? '已保存' : stuck ? '下面还有内容，往下滚' : '到底了'}
                </Small>
                <Flex gap="xs">
                  <Button size="sm" variant="ghost" tone="neutral" onClick={() => (saved = false)}>
                    取消
                  </Button>
                  <Button size="sm" onClick={() => (saved = true)}>
                    保存
                  </Button>
                </Flex>
              </Flex>
            </Card>
          </Affix>
        </Flex>
      </ScrollArea>
    </Card>
  );
});
