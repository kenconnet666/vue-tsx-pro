// 签收：签了字才能确认；确认后用只读的 SignaturePad 显示签好的图
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Button, Card, Field, Flex, SignaturePad, Small, Text } from '@zerodep-dev/vue-tsx-pro-ui';

export default _component(() => {
  let signature = _state<string | null>(null);
  let confirmedAt = _state<Date | null>(null);
  return () =>
    confirmedAt ? (
      <Card padding="md">
        <Flex direction="column" gap="sm">
          <Text weight="semibold">已签收</Text>
          <SignaturePad _value={signature} readonly height="7rem" aria-label="签收人签字" />
          <Flex justify="between" align="center">
            <Small tone="muted">{confirmedAt.toLocaleString()}</Small>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => ((confirmedAt = null), (signature = null))}
            >
              重新签收
            </Button>
          </Flex>
        </Flex>
      </Card>
    ) : (
      <Flex direction="column" gap="sm">
        <Field label="签收人签字" description="用鼠标、触控笔或手指写" required>
          <SignaturePad _value={signature} name="signature" />
        </Field>
        <Button disabled={!signature} onClick={() => (confirmedAt = new Date())}>
          确认签收
        </Button>
      </Flex>
    );
});
