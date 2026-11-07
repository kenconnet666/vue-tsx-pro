// 可以拖动的对话框：核对数据时把它挪开，看后面被挡住的表格；按住标题栏拖，不超出窗口，下次打开回到正中
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Button, Descriptions, Dialog, Flex, Small } from '@zerodep-dev/vue-tsx-pro-ui';

export default _component(() => {
  let open = _state(false);
  return () => (
    <Flex direction="column" gap="sm" align="start">
      <Button variant="outline" onClick={() => (open = true)}>
        核对付款信息
      </Button>
      <Small tone="muted">打开后按住标题栏拖动</Small>
      <Dialog
        _open={open}
        draggable
        title="付款信息"
        footer={<Button onClick={() => (open = false)}>确认无误</Button>}
      >
        <Descriptions
          columns={1}
          size="sm"
          items={[
            { label: '收款单位', value: '华辰精密机械有限公司' },
            { label: '开户行', value: '招商银行上海张江支行' },
            { label: '账号', value: '6214 8301 2233 4455' },
            { label: '金额', value: '¥128,000.00' },
          ]}
        />
      </Dialog>
    </Flex>
  );
});
